
var Scene = function (canvasId) {
	this.canvas = document.getElementById(canvasId);
	this.context = this.canvas.getContext('2d');
	
	this.fpsVal = 60;
	
	// TEST Game
	// Score, X, Angle
	this.starPosList = [[0, 1, 45], [0, 3, 45], [10, 300, -30];
	
	
	// DQN Sample
	this.samplePos = {x: 500, y: 500}; // Sample 이미지 시작 위치
    this.sampleCanvasList = [];
	this.sampleSizeList = [];
	
	// DQN
	this.CROPPING_SIZE = {width: 100, height: 100, depth: 4}; // 학습에 사용될 이미지 크기 및 개수
	this.REWARD_GAMMA = 0; // 0.9; // 미래 보상값에 대한 gamma 값
	this.TRAIN_EPOCH = 5; // 한번 train 할 때 시행할 epoch 값
	this.MINIMUM_EPSILON = 0.01; // 임의 행동의 최소 epsilon 값
	this.EPSILON_BETA = 0.998; // 임의 행동 epsilon 값의 감소율
	
	// Init
	this.init();
	this.initNetwork();
}
/*
DQN을 접목할 수 있는 모델: 
예측 가능한 시나리오
→ 같은 state에서 동일한 action을 할 때 무조건 같은 reward와 next state가 나와야 한다.
→ reward가 다른 state는 구분 가능해야한다.
*/
Scene.prototype = {
	init: function () {
        // DQN
        this.dataList = []; // 상태 저장 리스트
		this.replayDataList = []; // 총 플레이 데이터 리스트
		this.prevData = null; // 이전 상태값
		this.reward = 0; // 보상값
		this.prevReward = 0; // 이전 보상값
		this.prevActionNumber = -1; // 이전 행동
		this.predictList = null; // DQN의 각 Layer에서 forward된 값들
		
		// 오브젝트
		this.player = new Player();
		
		this.stars = [];
		this.starNum = 10;
		
		for (let i = 0; i < this.starNum; i++)
			this.stars.push(new Stars());
		this.particleObjects = [];
		
		// 화면 위치 및 진동
		this.pos = {x: 0, y: 0};
		this.waveFrame = 0;
		this.wavePower = 0;
	
		// 점수
		this.score = 0;
		this.prevStageScore = 0;
		this.bEndGame = false;
		
		// Frame
		this.fpsTime = clock();
		this.fpsCount = 0;
		this.fpsReal = 0;
		this.frameStartTime = clock();
	},
	start: function () {
		this.frame();
	},
	
	initNetwork: function () {
		let layer, resultSize;
		
		this.network = new Network(); // [망구조] http://incredible.ai/artificial-intelligence/2017/06/03/Deep-Reinforcement-Learning/
		
		resultSize = this.CROPPING_SIZE;
		this.sampleSizeList.push(resultSize);
		
		layer = new Layer_Convolution({width: 3, height: 3, depth: 4, num: 4}, 3, 1);
		resultSize = layer.calcSize(resultSize);
		this.sampleSizeList.push(resultSize);
		this.network.addLayer(layer);
		
		layer = new Layer_Convolution({width: 2, height: 2, depth: 4, num: 6}, 2);
		resultSize = layer.calcSize(resultSize);
		this.sampleSizeList.push(resultSize);
		this.network.addLayer(layer);
		
		resultSize = resultSize.width * resultSize.height * resultSize.depth;
		
		this.network.addLayer(new Layer_Flatten());
		this.network.addLayer(new Layer_Linear(resultSize, 250));
		
		this.network.addLayer(new Layer_LeackyReLU());
		this.network.addLayer(new Layer_Linear(250, 100));
		
		this.network.addLayer(new Layer_LeackyReLU());
		this.network.addLayer(new Layer_Linear(100, 50));
		
		this.network.addLayer(new Layer_LeackyReLU());
		this.network.addLayer(new Layer_Linear(50, 3));
		
		this.network.setErrorLayer(new ErrorLayer_MSE());
		
		// 학습
		this.epochCount = 0;
		this.actionEpsilon = 1;
		
		this.bRandomAction = true; // 랜덤 액션
		this.bNetworkAction = true; // 네트워크 액션
		
		// create sample canvas
		let padding = "   ";
		for (let i = 0; i < this.sampleSizeList.length; i++) {
			let sampleCanvas = [];
			let size = this.sampleSizeList[i];
			
			for (let j = 0; j < size.depth; j++) {
				let canvas = document.createElement('canvas');
				
				canvas.width = size.width * 5;
				canvas.height = size.height * 5;
				document.body.append(canvas);
				document.body.append(padding);
				sampleCanvas.push(canvas);
			}
			document.body.append(document.createElement("br"));
			this.sampleCanvasList.push(sampleCanvas);
		}
	},
	
	frame: function () {
		var currentTime = clock();
		// let frameInterval = (currentTime - this.frameStartTime) / 1000;
		let frameInterval = 1 / this.fpsVal;
        this.frameInterval = frameInterval;
		this.frameStartTime = currentTime;
		this.fpsCount++;
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		// Frame Content
		this.update(frameInterval);
		this.draw();
		
		if (!this.bEndGame)
			this.networkUpdate();
		else {
			this.networkLearning();
			this.init();
		}
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		// FPS Calculation
		currentTime = clock();
		if (currentTime - this.fpsTime >= 1000) {
			this.fpsTime = currentTime;
			this.fpsReal = this.fpsCount;
			this.fpsCount = 0;
		}
		
		// FPS Control
		var self = this;
		var delayTime = 1000/this.fpsVal - (currentTime - this.frameStartTime);
		delayTime = (delayTime < 0) ? 0 : delayTime;
		setTimeout(function () { self.frame.call(self) }, delayTime);
		// setTimeout(function () { self.frame.call(self) }, 0); // Non-Sync
	},
	update: function (frameInterval) {        
		this.player.update(frameInterval);
		
		// 점수 및 난이도 조절
		if (this.player.checkLive()) {
			this.score += 100 * frameInterval;
			
			if (this.score - this.prevStageScore > 750) {
				this.starNum++;
				for (let i = this.stars.length; i < this.starNum; i++)
					this.stars.push(new Stars());
				
				this.prevStageScore = this.score;
			}
		}
		
		// 유성
		var stars = this.stars;
		for (let i = stars.length - 1; i >= 0; i--) {
			stars[i].update(frameInterval);
			this.player.collision(stars[i]); // 충돌 확인
			
			this.particleObjects = this.particleObjects.concat(stars[i].popObjetcs());
			
			if (stars[i].checkCollision()) {
				this.wavePower += 5.0;
				if (this.player.live) {
					stars[i] = new Stars(); // 플레이어 살아있으면 유성 계속 생성
					this.reward++;
				}
				else
					stars.splice(i, 1); // 플레이어 죽으면 유성 생성 중단
			}
		}
		
		// 파티클 오브젝트
		for (let i = this.particleObjects.length - 1; i >= 0; i--) {
			this.particleObjects[i].update(frameInterval);
			if (this.particleObjects[i].checkExist())
				this.particleObjects.splice(i, 1);
		}
		
		// 화면 흔들림
		var waveFrame = this.waveFrame;
		this.waveFrame += frameInterval;
		if (this.waveFrame >= 1)
			this.waveFrame -= Math.floor(this.waveFrame);
		
		if (this.wavePower > 0.2)
			this.wavePower *= 0.8;
		else if (this.wavePower > 0)
			this.wavePower = 0;
		
		this.pos.x = Math.sin(this.waveFrame * Math.PI * 2) * this.wavePower; // 좌우 진동
		// this.pos.y = Math.cos(this.waveFrame * Math.PI * 2) * this.wavePower; // 상하 진동
	},
	
	draw: function () {
		var context = this.context;
		
		context.save();
        context.fillStyle = "#FFFFFF";
		context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        context.restore();
		
        context.save();
		this.drawFPS(context);
		this.drawScore(context);
		
		context.translate(this.pos.x, this.pos.y);
		
		this.player.draw(context);
		for (let i = 0; i < this.stars.length; i++)
			this.stars[i].draw(context);
		for (let i = 0; i < this.particleObjects.length; i++)
			this.particleObjects[i].draw(context);
		
		context.restore();
		
		// Extract Data
		let grayData = processImageData(context, this.CROPPING_SIZE.width, this.CROPPING_SIZE.height);
		this.dataList.push(grayData);
		
		// Draw Sample Image
		if (this.predictList == null) return;
		for (let i = 0; i < this.sampleCanvasList.length; i++) {
			for (let j = 0; j < this.sampleCanvasList[i].length; j++)
				drawImageData_Upsize(this.sampleCanvasList[i][j].getContext('2d'), decodeData(this.predictList[i][j]));
		}
	},
	drawFPS: function (context) {
		context.beginPath();
		context.fillText("FPS : " + this.fpsReal, 0, 10);
		context.stroke();
	},
	drawScore: function (context) {
		context.beginPath();
		context.fillText("score : " + Math.floor(this.score), context.canvas.width - 70, 10);
		context.stroke();
	},
	
	networkUpdate: function () {
		if (this.bEndGame) return ;
		if (this.dataList.length < this.CROPPING_SIZE.depth) return ;
		
		let data = [];
		for (let i = 0; i < this.CROPPING_SIZE.depth; i++)
			data[i] = encodeData(this.dataList[i]);
		this.dataList.shift();
		
		// Predict
		this.predictList = this.network.predict(data);
		let result = this.predictList[this.predictList.length-1];
		
		// 최대 보상값을 갖는 action number 찾기
		let maxIndex = 0;
		for (let i = 1; i < result.length; i++) {
			if (result[i] > result[maxIndex])
				maxIndex = i;
		}
		
		// 각 행동에 대한 보상값 출력 (TEST)
		let printResult = [];
		for (let i = 0; i < result.length; i++)
			printResult[i] = Math.round(result[i] * 1000) / 1000;
		console.log("[" + maxIndex + "] " + printResult);
		
		// Random greedy-epsilon: 확률적 임의 행동
		let actionNumber = maxIndex;
		if (this.bRandomAction) {
			if (Math.random() < this.actionEpsilon) {
				do
					actionNumber = Math.floor(Math.random() * 3);
				while (actionNumber >= 3);
				if (this.actionEpsilon > this.MINIMUM_EPSILON)
					this.actionEpsilon *= this.EPSILON_BETA;
			}
		}
		
		if (this.bNetworkAction) {
			// 선택한 actionNumber에 따라 행동
			switch (actionNumber) {
				case 0: this.player.setMoveState("LEFT");  break;
				case 1: this.player.setMoveState("STOP");  break;
				case 2: this.player.setMoveState("RIGHT"); break;
			}
		}
		else {
			// 플레이어 행동을 기록
			switch (this.player.lastMoveDir) {
				case -1: actionNumber = 0; break;
				case 0: actionNumber = 1; break;
				case 1: actionNumber = 2; break;
			}
		}
			
		// input(prevData), label(prevAction, prev reward, max reward of curr Data)
		if (this.prevData != null) {
			let label = [0, 0, 0];
			label[this.prevActionNumber] += this.prevReward + this.REWARD_GAMMA * result[maxIndex];
			this.replayDataList.push([this.prevData, label]);
			
			// if (this.prevReward != 0)
				// this.bEndGame = true;
			if (!this.player.checkLive())
				this.bEndGame = true;
		}
		
		this.prevData = data;
		// this.prevReward = this.reward; // 피한 유성 수를 reward로
		this.reward = 0;
		this.prevReward = 1; // 살아있는 시간을 reward로
		
		// 특정 점수에 도달한걸 보상으로
		// this.prevReward = 0;
		// if (!this.player.checkLive())
		// 	this.prevReward = (this.score >= 5000) ? 10 : -1;
		
		this.prevActionNumber = actionNumber;
	},
	networkLearning: function () {
		//TODO: replayDataList 섞기
		//TODO: 반복 학습
		console.log("game scroe: " + this.score +  "[" + this.actionEpsilon + "]");
		
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		for (let c = 0; c < this.TRAIN_EPOCH; c++) {
			// 자료 순서 섞기
			for (let i = 0; i < this.replayDataList.length/2; i++) {
				let p = Math.round(Math.random() * (this.replayDataList.length - 1));
				let q = Math.round(Math.random() * (this.replayDataList.length - 1));

				let temp = this.replayDataList[p];
				this.replayDataList[p] = this.replayDataList[q];
				this.replayDataList[q] = temp;
			}
			
			// 학습
			for (let i = 0; i < this.replayDataList.length; i++) {
				let data = this.replayDataList[i][0].slice(), label = this.replayDataList[i][1].slice();
				
				data = this.network.forward(data);
				for (let j = 0; j < data.length; j++)
					if (label[j] == 0) label[j] += data[j];
				
				data = this.network.errorLayer.diff(data, label);
				this.network.backward(data);
			}
			console.log("epoch: " + ++this.epochCount); // TEST
		}
	},
	
	keyDown: function (e) {
		switch (e.keyCode) {
			case 90: this.bNetworkAction = !this.bNetworkAction; console.log("networkAction: " + this.bNetworkAction); break; // z
			case 88: this.bRandomAction = !this.bRandomAction; console.log("randomAction: " + this.bRandomAction); break; // x
		}
		this.player.keyDown(e);
	},
	keyPress: function (e) {
	},
	keyUp: function (e) {
		this.player.keyUp(e);
	},
	mouseDown: function (e) {
	}
};

var scene = new Scene("mainCanvas");

document.addEventListener('keydown',	function (e) { scene.keyDown(e); });
document.addEventListener('keypress',	function (e) { scene.keyPress(e); });
document.addEventListener('keyup',		function (e) { scene.keyUp(e); });
document.addEventListener('mousedown',	function (e) { scene.mouseDown(e); });
// mousedown, mousemove, mouseup

scene.start();