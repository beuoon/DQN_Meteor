let ErrorLayer_MSE = function () {
}
ErrorLayer_MSE.prototype = {
    calc: function (outputList, labelList) {
        let errorList = [];
        let layerSize = outputList[0].length;
        
        for (let c = 0; c < outputList.length; c++) {
            let output = outputList[c];
            let label = labelList[c];
            let error = [];
            
            for (let i = 0; i < layerSize; i++)
                error[i] = 0.5 * Math.pow(label[i] - output[i], 2);
            errorList.push(error);
        }
        
        return errorList;
    },
    
    diff: function (outputList, labelList) {
        let diffList = [];
        let layerSize = outputList[0].length;
        
        for (let c = 0; c < outputList.length; c++) {
            let output = outputList[c];
            let label = labelList[c];
            let diff = [];
            
            for (let i = 0; i < layerSize; i++)
                diff[i] = output[i] - label[i];
            diffList.push(diff);
        }
        
        return diffList;
    }
}