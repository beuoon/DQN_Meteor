let Layer_ReLU = function () {
    this.layerSize;
    this.inputList;
}

Layer_ReLU.prototype = {
    forward: function (dataList) {
        let outputList = [];
        this.inputList = dataList;
        this.layerSize = this.inputList[0].length;
        
        for (let c = 0; c < this.inputList.length; c++) {
            outputList[c] = [];
            for (let i = 0; i < this.layerSize; i++)
                outputList[c][i] = Math.max(this.inputList[c][i], 0);
        }
        
        return outputList;
    },
    backward: function (deltaList) {
        let outputList = [];
        
        for (let c = 0; c < deltaList.length; c++) {
            outputList[c] = [];
            for (let i = 0; i < this.layerSize; i++)
                outputList[c][i] = (this.inputList[c][i] > 0) ? deltaList[c][i] : 0;
        }
        
        return outputList;
    }
}