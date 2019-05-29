let Layer_Flatten = function () {
    this.inputInfo;
}
Layer_Flatten.prototype = {
    forward: function (dataList) {
        this.inputInfo = {width: dataList[0][0].length, height: dataList[0].length, depth: dataList.length};
        let output = [];
        
        for (let z = 0; z < this.inputInfo.depth; z++) {
            for (let y = 0; y < this.inputInfo.height; y++) {
                for (let x = 0; x < this.inputInfo.width; x++)
                    output.push(dataList[z][y][x]);
            }
        }
        
        return [output];
    },
    backward: function (deltaList) {
        let output = [];
        let index = 0;
		
        for (let z = 0; z < this.inputInfo.depth; z++) {
            output[z] = [];
            for (let y = 0; y < this.inputInfo.height; y++) {
                output[z][y] = [];
                for (let x = 0; x < this.inputInfo.width; x++) {
                    output[z][y][x] = deltaList[0][index++];
				}
            }
        }
        deltaList = output;
        
        return deltaList;
    }
}