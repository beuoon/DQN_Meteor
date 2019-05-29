let Layer_Linear = function (inLayerSize, outLayerSize, optimizer = "MOMENTUM") {
    this.ETA = 0.005;
    this.inLayerSize = inLayerSize, this.outLayerSize = outLayerSize; // 입력 크기, 출력 크기
    this.weight = [];
    this.inputList;
    
    this.optimizer = optimizer;
    this.MOMENTUM_BETA = 0.9;
    this.weightMomentum = [];
    
    let weightLimit = Math.sqrt(6.0/inLayerSize); // He 초기화 사용 변수
    for (let i = 0; i < outLayerSize; i++) {
        this.weight[i] = [];
        this.weightMomentum[i] = [];
        
        for (let j = 0; j <= inLayerSize; j++) {
            this.weight[i][j] = (Math.random() * 2 - 1) * weightLimit;
            this.weightMomentum[i][j] = 0;
        }
    }
}
    
Layer_Linear.prototype = {
    forward: function (dataList) {
        let outputList = [];
        this.inputList = dataList;
        
        for (let c = 0; c < this.inputList.length; c++) {
            let input = this.inputList[c];
            let output = [];
            
            for (let i = 0; i < this.outLayerSize; i++) {
                
                output[i] = 0;
                for (let j = 0; j < this.inLayerSize; j++)
                    output[i] += input[j] * this.weight[i][j];
                output[i] += this.weight[i][this.inLayerSize]; // Bias
            }
            
            outputList.push(output);
        }
        
        return outputList;
    },
    backward: function (deltaList) {
        let outputList = [];
        
        // Calc Delta
        for (let c = 0; c < deltaList.length; c++) {
            let input = this.inputList[c];
            let output = [];
            let delta = deltaList[c];
            
            for (let i = 0; i < this.inLayerSize; i++) {
                output[i] = 0;
                for (let j = 0; j < this.outLayerSize; j++)
                    output[i] += delta[j] * this.weight[j][i];
            }
            
            outputList.push(output);
        }
        
        switch (this.optimizer) {
            case "SGD":        this.train_SGD(deltaList);        break;
            case "MOMENTUM":   this.train_Momentum(deltaList);   break;
        }
        
        return outputList;
    },
    
    train_SGD: function (deltaList) {
        for (let c = 0; c < deltaList.length; c++) {
            let input = this.inputList[c];
            let delta = deltaList[c];
            
            for (let i = 0; i < this.outLayerSize; i++) {
                for (let j = 0; j < this.inLayerSize; j++)
                    this.weight[i][j] += -this.ETA * (delta[i] * input[j]);
                this.weight[i][this.inLayerSize] = -this.ETA * delta[i];
            }
        }
    },
    train_Momentum: function (deltaList) {
        for (let c = 0; c < deltaList.length; c++) {
            let input = this.inputList[c];
            let delta = deltaList[c];
            
            for (let i = 0; i < this.outLayerSize; i++) {
                for (let j = 0; j < this.inLayerSize; j++) {
                    this.weightMomentum[i][j] = this.MOMENTUM_BETA * this.weightMomentum[i][j] + (1 - this.MOMENTUM_BETA) * (delta[i] * input[j]);
                    this.weight[i][j] += -this.ETA * this.weightMomentum[j];
                }
                this.weightMomentum[this.inLayerSize] = this.MOMENTUM_BETA * this.weightMomentum[this.inLayerSize] + (1 - this.MOMENTUM_BETA) * delta[i];
                this.weight[this.inLayerSize] += -this.ETA * this.weightMomentum[this.inLayerSize];
            }
        }
    }
}