import {BasicViewExtended} from 'library-aurelia/src/prototypes/basic-view-extended';

class SignsView extends BasicViewExtended {

    iso = {
        w: ['W001', 'W009', 'W012', 'W016', 'W017', 'W018', 'W023'],
        p: ['P001', 'P005', 'P010', 'P024', 'P028', 'P029'],
        m: ['M001', 'M002', 'M004', 'M008', 'M009', 'M010', 'M011', 'M013', 'M016', 'M017', 'M022', 'M030', 'M047'],
        e: ['E001', 'E002', 'E003', 'E009', 'E011']
    };

}

export {SignsView};
