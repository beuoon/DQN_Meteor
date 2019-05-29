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
function processImageData(context, width, height) {
    let CW = context.canvas.width, CH = context.canvas.height;
    let widthRate = CW/width, heightRate = CH/height;
    
    let imageData = context.getImageData(0, 0, CW, CH),
        data = imageData.data;
    
    let result = [];
    for (let y = 0; y < height; y++) {
        result[y] = [];
        for (let x = 0; x < width; x++) {
            result[y][x] = 0;
            
            for (let p = 0; p < heightRate; p++) {
                for (let q = 0; q < widthRate; q++) {
                    let index = ((y*heightRate + p)*CW + x*widthRate + q) * 4;
                    result[y][x] += (data[index + 0] + data[index + 1] + data[index + 2])/3;
                }
            }
            
            result[y][x] /= heightRate * widthRate;
        }
    }
    
    return result;
}
function processData(data) {
    let result = [];
    let width = data[0].length, height = data.length;
    
    for (let y = 0; y < height; y++) {
        result[y] = [];
        for (let x = 0; x < width; x++)
            result[y][x] = 1 - (data[y][x] / 255);
    }
    
    return result;
}
function drawImageData(context, grayData) { // draw gray data that were processed.
    let width = grayData[0].length, height = grayData.length;
    context.canvas.width = width, context.canvas.height = height;
    
	let imageData = context.getImageData(0, 0, width, height),
		data = imageData.data;
	
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let index = (y * width + x) * 4;
			
			for (let k = 0; k < 3; k++)
				data[index + k] = grayData[y][x];
			data[index + 3] = 255;
		}
	}
	
	context.putImageData(imageData, 0, 0);
}