let Network = function () {
    this.layers = []
    this.errorLayer;
}
Network.prototype = {
    addLayer: function (layer) {
        this.layers.push(layer);
    },
    setErrorLayer: function (layer) {
        this.errorLayer = layer;
    },
    
    predict: function(data) {
		let dataList = [data];
        for (let i = 0; i < this.layers.length; i++)
            dataList[i+1] = this.layers[i].forward(dataList[i]);
        return dataList;
    },
    train: function(data, label) {
        data = this.forward(data);
        data = this.errorLayer.diff(data, label);
        this.backward(data);
    },
    evaluate: function(data, label) {
        data = this.forward(data);
        data = this.errorLayer.calc(data, label);
        
        let errorWidth = data[0][0].length,
            errorHeight = data[0].length;
        
        let errorAvrg = 0;
        for (let c = 0; c < data.length; c++) {
            let error = data[c];
            
            for (let y = 0; y < errorHeight; y++) {
                for (let x = 0; x < errorWidth; x++)
                    errorAvrg += error[y][x];
            }
        }
        errorAvrg /= data.length * errorWidth * errorHeight;
        
        return errorAvrg;
    },
    
    forward: function(data) {
        for (let i = 0; i < this.layers.length; i++)
            data = this.layers[i].forward(data);
        return data;
    },
    backward: function(data) {
        for (let i = this.layers.length - 1; i >= 0; i--)
            data = this.layers[i].backward(data);
    }
}
