let Layer_Flatten = function () {
    this.inputInfo;
}
Layer_Flatten.prototype = {
    forward: function (data) {
        this.inputInfo = {width: data[0][0].length, height: data[0].length, depth: data.length};
        let output = [];
        
        for (let z = 0; z < this.inputInfo.depth; z++) {
            for (let y = 0; y < this.inputInfo.height; y++) {
                for (let x = 0; x < this.inputInfo.width; x++)
                    output.push(data[z][y][x]);
            }
        }
        
        return output;
    },
    backward: function (delta) {
        let output = [];
        let index = 0;
		
        for (let z = 0; z < this.inputInfo.depth; z++) {
            output[z] = [];
            for (let y = 0; y < this.inputInfo.height; y++) {
                output[z][y] = [];
                for (let x = 0; x < this.inputInfo.width; x++) {
                    output[z][y][x] = delta[index++];
				}
            }
        }
        
        return output;
    }
}