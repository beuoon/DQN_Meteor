/*
DQN 클래스 모델:
[망구조] http://incredible.ai/artificial-intelligence/2017/06/03/Deep-Reinforcement-Learning/

state: {image, image, image, ...}
data: {state, action, reward, nextState}

image → DQN → action
         ↑
	   reward
*/

let DQN = function () {
	// Network
	this.network = null;
	this.targetNetwork = null;
    this.errorLayer = new ErrorLayer_MSE();
	
	this.actionNum = 3;
	
	// Train
	this.replayDataList = []; // 리플레이 데이터 리스트
    this.imageList = []; // 게임 이미지 임시 배열
	this.data = null; // {state, action, reward, nextState}
	
	this.epochCount = 0;
	
	this.actionEpsilon = 1;	
	this.bRandomAction = true; // 랜덤 액션
	
	// Constant
	this.CHANGE_TARGET_NETWORK_INTERVAL = 20;
	
	this.REPLAY_DATA_MAX = 500;
	this.IMAGE_SIZE = {width: 50, height: 50}; // 학습에 사용될 이미지 크기
	this.STATE_SIZE = 4; // 학습에 사용될 이미지 개수
	
	this.REWARD_GAMMA = 0.9; // 미래 보상값에 대한 gamma 값
	
	this.MINIMUM_EPSILON = 0.01; // 임의 행동의 최소 epsilon 값
	this.EPSILON_BETA = 0.98; // 임의 행동 epsilon 값의 감소율
	
	this.init();
}
DQN.prototype = {
    init: function () {
		this.network = new Network();
		
		// Set Layer
		let layer, layerSize;
		layerSize = {width: this.IMAGE_SIZE.width, height: this.IMAGE_SIZE.height, depth: this.STATE_SIZE};
		
		layer = new Layer_Convolution({width: 4, height: 4, depth: 4, num: 6}, 4, 1);
		layerSize = layer.calcSize(layerSize);
		this.network.addLayer(layer);
		
		layer = new Layer_Convolution({width: 3, height: 3, depth: 6, num: 8}, 3, 1);
		layerSize = layer.calcSize(layerSize);
		this.network.addLayer(layer);
		
		layer = new Layer_Flatten(layerSize);
		layerSize = layer.outputSize;
		this.network.addLayer(layer);
		
		this.network.addLayer(new Layer_Linear(layerSize, 200));
		this.network.addLayer(new Layer_LeackyReLU());
		
		this.network.addLayer(new Layer_Linear(200, 100));
		this.network.addLayer(new Layer_LeackyReLU());
		
		this.network.addLayer(new Layer_Linear(100, 50));
		this.network.addLayer(new Layer_LeackyReLU());
		
		this.network.addLayer(new Layer_Linear(50, this.actionNum));
		
		// Create Target Network
		this.targetNetwork = this.network.clone();
		
		this.replayDataList = [];
		this.reset();
    },
	turnRandomAction: function (bRandomAction) {
		this.bRandomAction = bRandomAction;
	},
	
	update: function (image) {
		this.imageList.push(image);
		
		if (this.imageList.length < this.STATE_SIZE)
			return null;
		if (this.imageList.length > this.STATE_SIZE)
			this.imageList.shift();
		
		// Save Data
		if (this.data != null) {
			this.data.nextState = this.imageList.slice();
			this.replayDataList.push(this.data);
			if (this.replayDataList.length > this.REPLAY_DATA_MAX)
				this.replayDataList.shift();
		}
		// Create Data
		this.data = {state: this.imageList.slice(), action: -1, reward: 0, nextState: null};
		
		// 예측
		let result = this.network.forward(this.data.state);
		
		// 최대 보상값을 갖는 Action 찾기
		let actionNumber = 0;
		for (let i = 1; i < result.length; i++) {
			if (result[i] > result[actionNumber])
				actionNumber = i;
		}
		
		// [TEST] predict reward 출력
		let tempResult = result.slice();
		for (let i = 0; i < tempResult.length; i++)
			tempResult[i] = Math.floor(tempResult[i] * 1000) / 1000;
		console.log("PredictReward[" + actionNumber + "]: " + tempResult);
		
		// Random greedy-epsilon: 확률적 임의 행동
		if (this.bRandomAction && Math.random() < this.actionEpsilon) {
			do
				actionNumber = Math.floor(Math.random() * this.actionNum);
			while (actionNumber >= this.actionNum);
		}
		
		this.data.action = actionNumber;
		return actionNumber;
	},
	setReward: function (reward) {
		if (this.data != null)
			this.data.reward = reward;
	},
	reset: function () {
		this.imageList = [];
		if (this.data != null) {
			this.replayDataList.push(this.data);
			if (this.replayDataList.length > this.REPLAY_DATA_MAX)
				this.replayDataList.shift();
			this.data = null;
		}
	},
    
    train: function() {
		let replayDatas = this.replayDataList.slice();
		
		// Suffle
		for (let i = 0; i < replayDatas.length/2; i++) {
			let p = Math.round(Math.random() * (replayDatas.length - 1));
			let q = Math.round(Math.random() * (replayDatas.length - 1));

			let temp = replayDatas[p];
			replayDatas[p] = replayDatas[q];
			replayDatas[q] = temp;
		}
		
		// Online Train
		for (let i = 0; i < replayDatas.length; i++) {
			let replayData = replayDatas[i];
			
			let predictReward = this.network.forward(replayData.state);
			let futureReward = 0;
			if (replayData.nextState != null) {
				let result = this.targetNetwork.forward(replayData.nextState);
				
				futureReward = result[0];
				for (let k = 1; k < result.length; k++) {
					if (futureReward < result[k])
						futureReward = result[k];
				}
			}
			
			let targetReward = predictReward.slice();
			targetReward[replayData.action] = replayData.reward + this.REWARD_GAMMA*futureReward;
			
			let delta = this.errorLayer.diff(predictReward, targetReward);
			this.network.backward(delta);
		}
		
		// Change Target Network
		if (++this.epochCount % this.CHANGE_TARGET_NETWORK_INTERVAL == 0)
			this.targetNetwork = this.network.clone();
		console.log("epoch: " + this.epochCount); // TEST
		
		// Reduce Action Epsilon
		if (this.actionEpsilon > this.MINIMUM_EPSILON) {
			this.actionEpsilon *= this.EPSILON_BETA;
			if (this.actionEpsilon < this.MINIMUM_EPSILON)
				this.actionEpsilon = this.MINIMUM_EPSILON;
			console.log("ActionEpsilon: " + this.actionEpsilon);
		}
    },
}
