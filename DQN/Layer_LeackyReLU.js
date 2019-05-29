let Layer_LeackyReLU = function () {
    this.layerSize;
    this.inputList;
}

Layer_LeackyReLU.prototype = {
    forward: function (dataList) {
        let outputList = [];
        this.inputList = dataList;
        this.layerSize = this.inputList[0].length;
        
        for (let c = 0; c < this.inputList.length; c++) {
            outputList[c] = [];
            for (let i = 0; i < this.layerSize; i++)
                outputList[c][i] = Math.max(this.inputList[c][i], 0.01 * this.inputList[c][i]);
        }
        
        return outputList;
    },
    backward: function (deltaList) {
        let outputList = [];
        
        for (let c = 0; c < deltaList.length; c++) {
            outputList[c] = [];
            for (let i = 0; i < this.layerSize; i++)
                outputList[c][i] = ((this.inputList[c][i] >= 0) ? 1 : 0.01) * deltaList[c][i];
        }
        
        return outputList;
    }
}