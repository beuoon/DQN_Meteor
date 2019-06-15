let Layer_Linear = function (inLayerSize, outLayerSize, optimizer = "MOMENTUM") {
    this.ETA = 0.005;
    this.inLayerSize = inLayerSize, this.outLayerSize = outLayerSize; // 입력 크기, 출력 크기
    this.weight = [];
    this.input;
    
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
    forward: function (data) {
		let output = [];
		this.input = data;
		
		for (let i = 0; i < this.outLayerSize; i++) {
			output[i] = 0;
			for (let j = 0; j < this.inLayerSize; j++)
				output[i] += this.input[j] * this.weight[i][j];
			output[i] += this.weight[i][this.inLayerSize]; // Bias
		}
		
		return output;
    },
    backward: function (delta) {
		let output = [];
        
		for (let i = 0; i < this.inLayerSize; i++) {
			output[i] = 0;
			for (let j = 0; j < this.outLayerSize; j++)
				output[i] += delta[j] * this.weight[j][i];
        }
        
        switch (this.optimizer) {
            case "SGD":        this.train_SGD(delta);        break;
            case "MOMENTUM":   this.train_Momentum(delta);   break;
        }
        
        return output;
    },
    
    train_SGD: function (delta) {
		for (let i = 0; i < this.outLayerSize; i++) {
			for (let j = 0; j < this.inLayerSize; j++)
				this.weight[i][j] += -this.ETA * (delta[i] * this.input[j]);
			this.weight[i][this.inLayerSize] = -this.ETA * delta[i];
		}
    },
    train_Momentum: function (delta) {
		for (let i = 0; i < this.outLayerSize; i++) {
			for (let j = 0; j < this.inLayerSize; j++) {
				this.weightMomentum[i][j] = this.MOMENTUM_BETA * this.weightMomentum[i][j] + (1 - this.MOMENTUM_BETA) * (delta[i] * this.input[j]);
				this.weight[i][j] += -this.ETA * this.weightMomentum[i][j];
			}
			this.weightMomentum[i][this.inLayerSize] = this.MOMENTUM_BETA * this.weightMomentum[i][this.inLayerSize] + (1 - this.MOMENTUM_BETA) * delta[i];
			this.weight[i][this.inLayerSize] += -this.ETA * this.weightMomentum[i][this.inLayerSize];
		}
    }
}