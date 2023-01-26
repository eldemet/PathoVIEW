import {BasicComponent} from 'library-aurelia/src/prototypes/basic-component';
import {bindable} from 'aurelia-framework';
import {catchError} from 'library-aurelia/src/decorators';

class Camera extends BasicComponent {

    @bindable imageData;

    /** @type {HTMLVideoElement} */
    cameraVideo;
    /** @type {HTMLCanvasElement} */
    cameraCanvas;
    /** @type {HTMLCanvasElement} */
    drawingCanvas;
    /** @type {HTMLElement} */
    wrap;

    isLoading = true;
    /** @type {MediaStreamConstraints} */
    constraints = {
        audio: false,
        video: {
            // @ts-ignore
            mandatory: {maxWidth: 1920, maxHeight: 1080},
            optional: [{minWidth: 1280}, {minHeight: 720}]
        }
    };
    mediaOptions = [];
    isCaptureMode = true;
    fabColor = '#ff0000';
    selectedTool = 'middle';

    async attached() {
        super.attached();
        window.addEventListener('resize', this.resizeWindowHandler.bind(this));
        // Get Media Sources if browser is Chrome, because Chrome has no option to choose video sources
        if (this.responsiveService.isChromeBrowser()) {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                for (let device of devices) {
                    if (device.kind === 'videoinput') {
                        this.mediaOptions.push(device);
                    }
                }
                this.selectedMedia = this.mediaOptions[0].deviceId; // Set first Media Device as selected
            } catch (error) {
                this.logger.error(error.message);
            }
        }
        this.showToolbarLeft = this.responsiveService.matchCondition('md', true, this.wrap);
        this.subscriptions.push(this.eventAggregator.subscribe('device-class-changed', payload => {
            this.showToolbarLeft = this.responsiveService.matchCondition('md', true, this.wrap);
        }));
        await this.initializeMediaStream();
        this.fabric = (await import('fabric')).fabric;
        this.fabricFactory = new FabricFactory(this.fabric);
    }

    detached() {
        super.detached();
        window.removeEventListener('resize', this.resizeWindowHandler);
        if (this.isCaptureMode) {
            this.stopMediaStream();
        } else {
            this.stopDrawing();
        }
    }

    async initializeMediaStream() {
        this.isLoading = true;
        this.cameraError = null;
        if (!this.isCaptureMode) {
            this.stopDrawing();
            this.isCaptureMode = true;
        }
        let constraints = this.constraints;
        if (this.responsiveService.isChromeBrowser()) {
            this.stopMediaStream();
            constraints = this._.merge({}, this.constraints, {video: {optional: [{}, {}, {sourceId: this.selectedMedia}]}});
        }
        // @ts-ignore
        this.logger.debug(constraints);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.mediaStream = mediaStream;
            if (this.cameraVideo) {
                this.cameraVideo.srcObject = mediaStream;
                this.cameraVideo.onloadedmetadata = () => {
                    this.cameraVideo.play();
                    this.isLoading = false;
                };
            }
        } catch (error) {
            this.logger.error(error.message);
            let cameraError;
            if (error.name === 'DevicesNotFoundError') {
                cameraError = {type: 'warning', message: 'alerts.camera.noVideoSource'};
            } else {
                cameraError = {type: 'danger', message: 'alerts.camera.videoSourceError'};
            }
            this.isLoading = false;
            this.cameraError = cameraError;
        }
    }

    @catchError()
    stopMediaStream() {
        if (this.mediaStream) {
            let track = this.mediaStream.getTracks()[0];
            track.stop();
            this.cameraVideo.pause();
        }
    }

    initializeDrawing() {
        this.isLoading = true;
        if (this.isCaptureMode) {
            this.drawVideoOnCanvas();
            this.stopMediaStream();
            this.isCaptureMode = false;
        }
        let ctx = this.drawingCanvas.getContext('2d');
        ctx.canvas.width = this.cameraVideo.videoWidth;
        ctx.canvas.height = this.cameraVideo.videoHeight;
        this.setImageData();
        this.fabcanvas = new this.fabric.Canvas(this.drawingCanvas, {selection: false});
        let circle, rect, line, triangle, arrow; // eslint-disable-line one-var
        this.mouseDownHandler = event => {
            if ((this.selectedTool === 'rect' || this.selectedTool === 'circle' || this.selectedTool === 'arrow') && !this.fabcanvas.getActiveObject()) {
                let pointer = this.fabcanvas.getPointer(event.e);
                if (this.selectedTool === 'rect') {
                    rect = this.fabricFactory.createRectangle(pointer.y, pointer.x, this.fabColor, this.fabColor);
                    this.fabcanvas.add(rect);
                    this.mouseMoveHandler = e => {
                        rect.set(FabricProcessor.getRectangleResizeOptions(pointer.y, pointer.x, this.fabcanvas.getPointer(e.e)));
                        rect.setCoords();
                        this.fabcanvas.renderAll();
                    };
                } else if (this.selectedTool === 'circle') {
                    circle = this.fabricFactory.createCircle(pointer.y, pointer.x, this.fabColor, this.fabColor);
                    this.fabcanvas.add(circle);
                    this.mouseMoveHandler = e => {
                        let p = this.fabcanvas.getPointer(e.e);
                        circle.set(FabricProcessor.getCircleResizeOptions(pointer.y, pointer.x, p));
                        circle.setCoords();
                        this.fabcanvas.renderAll();
                    };
                } else if (this.selectedTool === 'arrow') {
                    line = this.fabricFactory.createLine(pointer.y, pointer.x, this.fabColor);
                    triangle = this.fabricFactory.createTriangle(pointer.y, pointer.x, this.fabColor);
                    this.fabcanvas.add(line);
                    this.fabcanvas.add(triangle);
                    this.mouseMoveHandler = e => {
                        let p = this.fabcanvas.getPointer(e.e);
                        line.set(FabricProcessor.getLineResizeOptions(pointer.y, pointer.x, p));
                        line.setCoords();
                        triangle.set(FabricProcessor.getTriangleResizeOptions(pointer.y, pointer.x, p, line));
                        triangle.setCoords();
                        this.fabcanvas.renderAll();
                    };
                }
                this.fabcanvas.on('mouse:move', this.mouseMoveHandler);
            }
        };
        this.mouseUpHandler = event => {
            try {
                this.fabcanvas.off('mouse:move', this.mouseMoveHandler);
                if (!this.fabcanvas.getActiveObject()) {
                    if (this.selectedTool === 'rect') {
                        this.fabcanvas.setActiveObject(rect);
                    }
                    if (this.selectedTool === 'circle') {
                        this.fabcanvas.setActiveObject(circle);
                    }
                    if (this.selectedTool === 'arrow') {
                        arrow = new this.fabric.Group([line, triangle]);
                        this.fabcanvas.remove(line);
                        this.fabcanvas.remove(triangle);
                        this.fabcanvas.add(arrow);
                        this.fabcanvas.setActiveObject(arrow);
                    }
                }
            } catch (error) {
                this.logger.error(error.message);
            }
            this.setImageData();
        };
        this.fabcanvas.on('mouse:down', this.mouseDownHandler);
        this.fabcanvas.on('mouse:up', this.mouseUpHandler);
        this.resizeCanvas();
        this.changeSelectedTool(this.selectedTool);
        this.isLoading = false;
    }

    @catchError()
    stopDrawing() {
        this.undoAllDrawings();
        this.fabcanvas.off('mouse:up', this.mouseUpHandler);
        this.fabcanvas.off('mouse:down', this.mouseDownHandler);
        this.fabcanvas = null;
        this.cameraVideo.before(this.drawingCanvas);
        const upperCanvas = document.querySelector('.upper-canvas');
        if (upperCanvas) upperCanvas.remove();
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) canvasContainer.remove();
    }

    drawVideoOnCanvas() {
        if (!this.cameraVideo.paused && !this.cameraVideo.ended) {
            let ctx = this.cameraCanvas.getContext('2d');
            ctx.canvas.width = this.cameraVideo.videoWidth;
            ctx.canvas.height = this.cameraVideo.videoHeight;
            ctx.drawImage(this.cameraVideo, 0, 0);
            this.isCaptureMode = false;
            this.cameraVideo.pause();
        }
    }

    changeColor() {
        if (this.fabcanvas) {
            this.fabcanvas.freeDrawingBrush.color = this.fabColor;
        }
    }

    changeSelectedTool(tool) {
        if (tool === 'thin' || tool === 'middle' || tool === 'thick') {
            this.fabcanvas.isDrawingMode = true;
            let brushWidth;
            switch (tool) {
                case 'thin':
                    brushWidth = 5;
                    break;
                case 'thick':
                    brushWidth = 15;
                    break;
                default:
                    brushWidth = 10;
            }
            this.fabcanvas.freeDrawingBrush.width = brushWidth;
            this.fabcanvas.freeDrawingBrush.shadowBlur = 0;
            this.fabcanvas.freeDrawingBrush.color = this.fabColor;
        } else if (tool === 'circle' || tool === 'rect' || tool === 'arrow') {
            this.fabcanvas.isDrawingMode = false;
        }
        this.selectedTool = tool;
    }

    undoAllDrawings() {
        if (this.fabcanvas) {
            this.fabcanvas.clear();
        }
    }

    undoLastDrawing() {
        let objects = this.fabcanvas.getObjects();
        if (objects.length > 0) {
            let last = objects[objects.length - 1];
            this.fabcanvas.remove(last);
            this.fabcanvas.renderAll();
        }
    }

    resizeCanvas() {
        const ratio = this.fabcanvas.getWidth() / this.fabcanvas.getHeight();
        const containerWidth = this.wrap.clientWidth;
        const scale = containerWidth / this.fabcanvas.getWidth();
        const zoom = this.fabcanvas.getZoom() * scale;
        this.fabcanvas.setDimensions({width: containerWidth, height: containerWidth / ratio});
        this.fabcanvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
    }

    @catchError()
    setImageData() {
        this.drawVideoOnCanvas();
        if (this.fabcanvas) {
            this.fabcanvas.discardActiveObject();
            this.fabcanvas.renderAll();
            let ctx = this.cameraCanvas.getContext('2d');
            ctx.drawImage(this.drawingCanvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        this.imageData = this.cameraCanvas.toDataURL('image/png', 1);
    }

    resizeWindowHandler() {
        let id;
        clearTimeout(id);
        id = setTimeout(() => {
            if (this.fabcanvas) {
                this.resizeCanvas();
            }
        }, 200);
    }

}

export class FabricFactory {

    static FABRIC_ANGLE = 0;
    static FABRIC_INACTIVE_OPACITY = 0.2;
    static FABRIC_ACTIVE_OPACITY = 0.8;
    static FABRIC_STROKE_WIDTH = 2;
    static FABRIC_ARROW_STROKE_WIDTH = 6;
    static FABRIC_ARROW_TRIANGLE_WIDTH = 25;
    static FABRIC_ARROW_TRIANGLE_HEIGHT = 40;

    constructor(fabric) {
        this.fabric = fabric;
    }

    createRectangle(startY, startX, fillColor, strokeColor, id, selectable, hasControls) {
        return new this.fabric.Rect({
            top: startY,
            left: startX,
            originX: 'left',
            originY: 'top',
            angle: FabricFactory.FABRIC_ANGLE,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: FabricFactory.FABRIC_STROKE_WIDTH,
            opacity: FabricFactory.FABRIC_ACTIVE_OPACITY,
            id: id,
            selectable: selectable,
            hasControls: hasControls
        });
    }

    createCircle(startY, startX, fillColor, strokeColor, id, selectable, hasControls) {
        return new this.fabric.Circle({
            top: startY,
            left: startX,
            originX: 'left',
            originY: 'top',
            angle: FabricFactory.FABRIC_ANGLE,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: FabricFactory.FABRIC_STROKE_WIDTH,
            opacity: FabricFactory.FABRIC_ACTIVE_OPACITY,
            id: id,
            selectable: selectable,
            hasControls: hasControls
        });
    }

    createLine(startY, startX, color, id, selectable, hasControls, scale) {
        return new this.fabric.Line([startX, startY, startX, startY], {
            top: startY,
            left: startX,
            originX: 'left',
            originY: 'top',
            stroke: color,
            strokeWidth: scale ? FabricFactory.FABRIC_ARROW_STROKE_WIDTH * scale : FabricFactory.FABRIC_ARROW_STROKE_WIDTH,
            opacity: FabricFactory.FABRIC_ACTIVE_OPACITY,
            id: id,
            selectable: selectable,
            hasControls: hasControls
        });
    }

    createTriangle(startY, startX, color, id, selectable, hasControls, scale) {
        return new this.fabric.Triangle({
            top: startY,
            left: startX,
            originX: 'center',
            originY: 'bottom',
            fill: color,
            opacity: FabricFactory.FABRIC_ACTIVE_OPACITY,
            width: scale ? FabricFactory.FABRIC_ARROW_TRIANGLE_WIDTH * scale : FabricFactory.FABRIC_ARROW_TRIANGLE_WIDTH,
            height: scale ? FabricFactory.FABRIC_ARROW_TRIANGLE_HEIGHT * scale : FabricFactory.FABRIC_ARROW_TRIANGLE_HEIGHT,
            id: id,
            selectable: selectable,
            hasControls: hasControls
        });
    }

    createArrow(startY, startX, color, id, selectable, hasControls) {
        let line = new this.fabric.Line([startX, startY, startX, startY], {
            top: startY,
            left: startX,
            originX: 'left',
            originY: 'top',
            stroke: color,
            strokeWidth: FabricFactory.FABRIC_ARROW_STROKE_WIDTH,
            opacity: FabricFactory.FABRIC_ACTIVE_OPACITY
        });
        let triangle = new this.fabric.Triangle({
            top: startY,
            left: startX,
            originX: 'center',
            originY: 'bottom',
            fill: color,
            opacity: FabricFactory.FABRIC_ACTIVE_OPACITY,
            width: FabricFactory.FABRIC_ARROW_TRIANGLE_WIDTH,
            height: FabricFactory.FABRIC_ARROW_TRIANGLE_HEIGHT
        });
        return new this.fabric.Group([line, triangle], {id: id, selectable: selectable, hasControls: hasControls});
    }

}


export class FabricProcessor {

    static getRectangleResizeOptions(startY, startX, pointer) {
        let rectOptions = {};
        if (startX > pointer.x) rectOptions.left = Math.abs(pointer.x);
        if (startY > pointer.y) rectOptions.top = Math.abs(pointer.y);
        rectOptions.width = Math.abs(pointer.x - startX);
        rectOptions.height = Math.abs(pointer.y - startY);
        return rectOptions;
    }

    static getCircleResizeOptions(startY, startX, pointer) {
        let circleOptions = {};
        circleOptions.originY = startY > pointer.y ? 'bottom' : 'top';
        circleOptions.radius = Math.abs(pointer.x - startX) / 2;
        if (startX > pointer.x) circleOptions.left = Math.abs(pointer.x);
        return circleOptions;
    }

    static getLineResizeOptions(startY, startX, pointer) {
        let lineOptions = {};
        lineOptions.width = Math.abs(pointer.x - startX);
        lineOptions.height = Math.abs(pointer.y - startY);
        lineOptions.flipX = startX > pointer.x;
        lineOptions.flipY = startY > pointer.y;
        if (startX > pointer.x) lineOptions.left = Math.abs(pointer.x);
        if (startY > pointer.y) lineOptions.top = Math.abs(pointer.y);
        return lineOptions;
    }

    static getTriangleResizeOptions(startY, startX, pointer, line) {
        let triangleOptions = {};
        triangleOptions.top = pointer.y + 2;
        triangleOptions.left = pointer.x + 2;
        let angle = 0;
        let ratio;
        if (pointer.x > startX) {
            angle = pointer.y < startY ? 0 : 90;
            ratio = pointer.y < startY ? (line.width / line.height) : (line.height / line.width);
        } else {
            angle = pointer.y > startY ? 180 : 270;
            ratio = pointer.y < startY ? (line.height / line.width) : (line.width / line.height);
        }
        triangleOptions.angle = (Math.atan(ratio) * (180 / Math.PI)) + angle;
        return triangleOptions;
    }

}

export {Camera};
