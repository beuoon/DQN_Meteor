function clock() {
	return +new Date();
}

function contextReverse(context, x, y, width, height) { // 좌우 반전
	var imageData = context.getImageData(x, y, width, height),
		data = imageData.data;
	var temp, leftIndex, rightIndex;
	
	for (let i = 0; i < height; i++) {
		for (let j = 0; j < width / 2; j++) {
			leftIndex = (i * width + j) * 4;
			rightIndex = (i * width + (width - j - 1)) * 4;
			
			for (let k = 0; k < 4; k++) {
				temp = data[leftIndex + k];
				data[leftIndex + k] = data[rightIndex + k];
				data[rightIndex + k] = temp;
			}
			
		}
	}		
	context.putImageData(imageData, x, y);
}
function contextNegative(context, x, y, width, height) { // 네거티브 필터
	var imageData = context.getImageData(x, y, width, height),
		data = imageData.data;
	var temp, index;
	
	for (let i = 0; i < height; i++) {
		for (let j = 0; j < width; j++) {
			index = (i * width + j) * 4;
			
			for (let k = 0; k < 3; k++)
				data[index + k] = 255 - data[index + k];
			data[index + 3] = 255;
		}
	}
	
	context.putImageData(imageData, x, y);
}
