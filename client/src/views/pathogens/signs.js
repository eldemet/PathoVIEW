import {BasicView} from 'library-aurelia/src/prototypes/basic-view';

class SignsView extends BasicView {

    iso = {
        w: ['W001', 'W003', 'W009', 'W010', 'W012', 'W016', 'W017', 'W018', 'W021', 'W023', 'W035', 'W056', 'W060', 'W064', 'W072', 'W074', 'W077'],
        p: ['P001', 'P005', 'P010', 'P024', 'P028', 'P029'],
        m: ['M001', 'M002', 'M004', 'M008', 'M009', 'M010', 'M011', 'M013', 'M016', 'M017', 'M022', 'M030', 'M047'],
        e: ['E001', 'E002', 'E003', 'E009', 'E011']
    };

}

export {SignsView};
