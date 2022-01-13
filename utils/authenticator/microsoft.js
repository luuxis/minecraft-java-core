let type;
if(!!process && !!process.versions && !!process.versions.electron) {
    type = 'electron';
} else if(!!process && !!process.versions && !!process.versions.nw) {
    type = 'nwjs';
} else {
    type = 'browser';
}

class Microsoft {
    constructor(id = "00000000402b5328"){
        if(id === "") id = "00000000402b5328"
        this.type = type;
        this.id = id;
    }  
}

module.exports = Microsoft;

