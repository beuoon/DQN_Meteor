
var Player = function () {
	// 캐릭터 (부위) 크기 및 위치
	this.drawWidth = 21, this.drawHeight = this.drawWidth/3 * 5;
	this.armPos = -this.drawWidth/7 / 3;
	this.armLen = this.drawWidth/5*2 / 2; // 상박 = 하박
	this.faceSize = this.drawWidth/5;
	this.facePos = -this.drawWidth/3;
	this.bodyLen = this.drawWidth/5;
	this.legLen = this.drawWidth/5*2;
	
	// 충돌
	this.size = {width: this.drawWidth/3*2, height: this.drawHeight/5*3};
	this.live = true;
	
	// 좌표, 각도
	this.pos = {x: 200, y: 400 - this.size.height/2};
	this.angle = 0;
	
	// 애니메이션 관절 각도	
	this.jointAngle = {'leftShoulder': Math.PI/6, 'leftElbow': Math.PI/2,'rightShoulder': -Math.PI/6,'rightElbow': Math.PI/18*(9+1.5)};
	this.jointRotate = {'leftShoulder': 0, 'leftElbow': 0,'rightShoulder': 0,'rightElbow': 0};
	
	
	// 애니메이션 설정
	var animationSpeed = 1;
	this.animations = {
		'start': {time:0, joint:[]},
		'idle': {time:0.1 / animationSpeed, joint:[{name:'leftShoulder', angle:Math.PI/18}, {name:'leftElbow', angle:Math.PI/6}, {name:'rightShoulder', angle:-Math.PI/18}, {name:'rightElbow', angle:Math.PI/6}]},
		'run1': {time:0.25 / animationSpeed, joint:[{name:'leftShoulder', angle:Math.PI/4}, {name:'leftElbow', angle:Math.PI/2}, {name:'rightShoulder', angle:-Math.PI/3}, {name:'rightElbow', angle:Math.PI/2}]},
		'run2': {time:0.25 / animationSpeed, joint:[{name:'leftShoulder', angle:-Math.PI/3}, {name:'leftElbow', angle:Math.PI/2}, {name:'rightShoulder', angle:Math.PI/4}, {name:'rightElbow', angle:Math.PI/2}]},
	};
	this.animationStatus = 'start';
	this.animationTime = 0;
	
	
	// 이동
	this.speed = 250;
	
	this.lastMoveDir = 0;
	this.moveLimit = {left: this.size.width/2, right: 400 - this.size.width/2};
	this.moveStatus = null;
	
	this.keyStatus = {left: false, right: false};
	
}
Player.prototype = {
	update: function (frameInterval) {
		if (!this.live) return false;
		
		this.move(frameInterval);
		this.animate(frameInterval);
 	},
	collision: function (star) {
		// star.pos, star.size
		var playerRect = {left: this.pos.x - this.size.width/2, top: this.pos.y + this.size.height/2,
			right: this.pos.x + this.size.width/2, bottom: this.pos.y - this.size.height/2};
		var starRect = {left: star.pos.x - star.size.width/2, top: star.pos.y + star.size.height/2,
			right: star.pos.x + star.size.width/2, bottom: star.pos.y - star.size.height/2};
		
		
		if (playerRect.left > starRect.right || playerRect.right < starRect.left ||
			playerRect.top < starRect.bottom || playerRect.bottom > starRect.top)
			return false;
			
		
		star.destroy();
		
		
		if (!this.live) return false;
		this.live = false;
		
		return true;
	},
	move: function (frameInterval) {
		var pos = this.pos, size = this.size;
		var keyStatus = this.keyStatus, moveStatus = this.moveStatus;
		var moveLimit = this.moveLimit;
		var speed = this.speed * frameInterval;
		
		// 이동 방향 계산
		let moveDir = 0;
		if (keyStatus.left && keyStatus.right) {
			if (moveStatus == 'left')
				moveDir = -1;
			else
				moveDir = 1;
		}
		else if (keyStatus.left)
			moveDir = -1;
		else if (keyStatus.right)
			moveDir = 1;
		this.moveDir = moveDir;
		
		// 이동
		if (moveDir != 0) {
			pos.x += moveDir * speed;
			this.lastMoveDir = moveDir;
		}
		
		
		// 이동 제한
		if (pos.x < moveLimit.left) pos.x = moveLimit.left;
		else if (pos.x > moveLimit.right) pos.x = moveLimit.right;
	},
	animate: function (frameInterval) {
		/*
		
		현재 시스템은 '20까지 2초이내에 움직여라'라는 뜻이여서
		현재 값이 10일 경우 1초에 5씩 더하고, 현재 값이 0일 경우 1초에 10씩 더하면 된다.
		이 시스템의 문제는 속도가 항상 일정하지 않다는 것이다.
		
		따라서, 시스템 '일정 시간내에 실행'이 아닌 '일정 속도로 실행'으로 바꿔야 한다.
		'1초에 x씩 y까지 움직인다'
		jointAngle += frameInterval * x; // x: (jointRotate)
		if (jointAngle > y) // y: animations['~~'].joint
			jointAngle = y;
		
		*/
		var curAnimation = this.animations[this.animationStatus];
		var prevAnimationStatus = this.animationStatus;
		
		// 애니메이션 상태 전환
		var checkMove = this.moveDir != 0; // 이동 유무
		
		switch (this.animationStatus) {
		case 'start':
			this.animationStatus = 'idle';
			break;
		case 'idle':
			if (checkMove)
				this.animationStatus = 'run1';
			break;
		case 'run1':
			if (checkMove && this.animationTime >= curAnimation.time)
				this.animationStatus = 'run2';
			else if (!checkMove)
				this.animationStatus = 'idle';
			break;
		case 'run2':
			if (checkMove && this.animationTime >= curAnimation.time)
				this.animationStatus = 'run1';
			else if (!checkMove)
				this.animationStatus = 'idle';
			break;
		}
		
		if (prevAnimationStatus != this.animationStatus) { // 애니메이션 전환 시
			curAnimation = this.animations[this.animationStatus];
			var joint = curAnimation.joint;
			
			for (let i = 0; i < joint.length; i++) {
				var curAngle = this.jointAngle[joint[i].name];
				var targetAngle = joint[i].angle;
				
				this.jointRotate[joint[i].name] = (targetAngle - curAngle) / curAnimation.time;
			}
			
			this.animationTime = 0;
		}
		else if (this.animationTime < curAnimation.time) { // 애니메이션 동작
			var animationFrame = frameInterval;
			this.animationTime += animationFrame;
			
			if (this.animationTime > curAnimation.time) {
				animationFrame -= this.animationTime - curAnimation.time;
				this.animationTime = curAnimation.time;
			}
			
			var joint = curAnimation.joint;
			for (let i = 0; i < joint.length; i++)
				this.jointAngle[joint[i].name] += this.jointRotate[joint[i].name] * animationFrame;
		}
	},
	
	draw: function (context) {
		var drawPos = {x: this.pos.x - this.drawWidth/2, y: this.pos.y - this.drawHeight/2};
		var drawWidth = this.drawWidth, drawHeight = this.drawHeight;
		
		var playerCanvas = document.createElement('canvas'),
			playerContext = playerCanvas.getContext('2d');
			
		playerCanvas.width = drawWidth;
		playerCanvas.height = drawHeight;
		
		// 컨텍스트 초기화
		playerContext.save();
		playerContext.beginPath();
		playerContext.fillStyle = '#FFFFFF';
		playerContext.fillRect(0, 0, drawWidth, drawHeight);
		playerContext.fill();
		playerContext.restore();
		
		// 캐릭터 렌더링
		this.drawBody(playerContext);
		
		// 효과
		if (this.lastMoveDir > 0)
			contextReverse(playerContext, 0, 0, drawWidth, drawHeight);
		if (!this.live)
			contextNegative(playerContext, 0, 0, drawWidth, drawHeight);
		
		//
		context.drawImage(playerCanvas, drawPos.x, drawPos.y, drawWidth, drawHeight);
	},
	drawBody: function (context) {
		var angle = this.angle;
		var	width = this.drawWidth, height = this.drawHeight;
		
		context.save();
		
		context.translate(width/2, height/2);
		context.rotate(angle);
		
		// 충돌 박스
		// context.strokeRect(-this.size.width/2, -this.size.height/2, this.size.width, this.size.height);
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		// 오른쪽 어깨 - 오른쪽 팔꿈치
		context.save();
		context.translate(0, this.armPos);
		context.rotate(this.jointAngle['rightShoulder']);
		
		context.beginPath();	
		context.moveTo(0, 0);
		context.lineTo(0, this.armLen);
		
		// 오른쪽 팔꿈치 - 오른손
		context.translate(0, this.armLen);
		context.rotate(this.jointAngle['rightElbow']);
		
		context.moveTo(0, 0);
		context.lineTo(0, this.armLen);
		
		context.stroke();
		
		// 오른손
		context.translate(0, this.armLen);
		context.fillStyle = "red";
		
		context.beginPath();
		context.arc(0, 0, 1, 0, Math.PI*2);
		context.fill();
		
		context.restore();
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		context.beginPath();
		
		// 얼굴
		context.arc(0, this.facePos, this.faceSize, 0, Math.PI*2);
		
		// 몸통
		context.moveTo(0, this.facePos + this.faceSize);
		context.lineTo(0, this.bodyLen);
		
		// 다리
		context.moveTo(0, this.bodyLen);
		context.lineTo(width/5, this.bodyLen + this.legLen);
		context.moveTo(0, this.bodyLen);
		context.lineTo(-width/5, this.bodyLen + this.legLen);
		
		context.stroke();
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		// 왼쪽 어깨 - 왼쪽 팔꿈치
		context.save();
		context.translate(0, this.armPos);
		context.rotate(this.jointAngle['leftShoulder']);
		
		context.beginPath();	
		context.moveTo(0, 0);
		context.lineTo(0, this.armLen);
		
		// 왼쪽 팔꿈치 - 왼손
		context.translate(0, this.armLen);
		context.rotate(this.jointAngle['leftElbow']);
		
		context.moveTo(0, 0);
		context.lineTo(0, this.armLen);
		
		context.stroke();
		
		// 왼손
		context.translate(0, this.armLen);
		context.fillStyle = "blue";
		
		context.beginPath();
		context.arc(0, 0, 1, 0, Math.PI*2);
		context.fill();
		
		context.restore();
		
		// 복구
		context.restore();
	},

	checkLive: function () {
		return this.live;
	},
    setMoveState: function (state) {
        switch (state) {
            case "LEFT": this.keyStatus.left = true;	this.moveStatus = 'left'; break;
            case "RIGHT":this.keyStatus.right = true;	this.moveStatus = 'right'; break;
            case "STOP": this.keyStatus.left = false;   this.keyStatus.right = false; break;
        }
    },
	
	keyDown: function (e) {
		var keyStatus = this.keyStatus;
		var moveStatus = this.moveStatus;
		
		switch (e.keyCode) {
			case 65: keyStatus.left = true;		moveStatus = 'left';	break; // a
			case 68: keyStatus.right = true;	moveStatus = 'right';	break; // d
		}
	},
	keyPress: function (e) {
	},
	keyUp: function (e) {
		var keyStatus = this.keyStatus;
		
		switch (e.keyCode) {
			case 65: keyStatus.left = false; break; // a
			case 68: keyStatus.right = false; break; // d
		}
	},
};