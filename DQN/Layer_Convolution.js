let Layer_Convolution = function (filterInfo, stride=1, paddingSize=0) {
    this.ETA = 0.005;
    
    this.filterInfo = filterInfo;
    this.stride = stride, this.paddingSize = paddingSize;
    
    this.weightList = [];
    this.biasList = [];
    
	this.IW, this.IH; // input width, input height
	this.PW, this.PH; // padding data width, padding data height
	this.CW, this.CH; // channel width, channel height
    this.uDataList = null;
    this.zDataList = null;
    
    let weightLimit = Math.sqrt(6.0/(filterInfo.width * filterInfo.height * filterInfo.depth));
	
    this.weightList = [];
    this.biasList = [];
    for (let c = 0; c < filterInfo.num; c++) {
        let weight = [];
            
        for (let z = 0; z < filterInfo.depth; z++) {
            weight[z] = [];
            for (let y = 0; y < filterInfo.height; y++) {
                weight[z][y] = [];
                for (let x = 0; x < filterInfo.width; x++)
                    weight[z][y][x] = (Math.random() * 2 - 1) * weightLimit;
            }
        }
        // let bias = (Math.random() * 2 - 1) * weightLimit;
        let bias = Math.random() * weightLimit;
		
        this.weightList.push(weight);
        this.biasList.push(bias);
    }
}

Layer_Convolution.prototype = {
	clone: function () {
		let layer = new Layer_Convolution(this.filterInfo, this.stride, this.paddingSize);
		
		// Copy Weight
		for (let c = 0; c < this.filterInfo.num; c++) {
			for (let z = 0; z < this.filterInfo.depth; z++) {
				for (let y = 0; y < this.filterInfo.height; y++)
					layer.weightList[c][z][y] = this.weightList[c][z][y].slice();
			}
		}
		
		// Copy Bias
		layer.biasList = this.biasList.slice();
		
		return layer;
	},
	calcSize: function (inputSize) {
        this.IW = inputSize.width;
		this.IH = inputSize.height;
		
        this.CW = (this.IW + 2*this.paddingSize - this.filterInfo.width)/this.stride + 1; // channel width
		this.CH = (this.IH + 2*this.paddingSize - this.filterInfo.height)/this.stride + 1; // chanel height
		
		this.PW = this.IW;
		this.PH = this.IH;
        
        // Zero Padding
        if (this.paddingSize > 0) {
            let paddingDataList = [];
            this.PW = this.IW + 2*this.paddingSize; // padding data width
			this.PH = this.IH + 2*this.paddingSize; // padding data height
		}
		
		return {width: this.CW, height: this.CH, depth: this.filterInfo.num};
	},
	
    forward: function (dataList) {
        this.IW = dataList[0][0].length;
		this.IH = dataList[0].length;

        this.CW = (this.IW + 2*this.paddingSize - this.filterInfo.width)/this.stride + 1; // channel width
		this.CH = (this.IH + 2*this.paddingSize - this.filterInfo.height)/this.stride + 1; // chanel height
		
		this.PW = this.IW;
		this.PH = this.IH;
        
        // Zero Padding
        if (this.paddingSize > 0) {
            let paddingDataList = [];
            this.PW = this.IW + 2*this.paddingSize; // padding data width
			this.PH = this.IH + 2*this.paddingSize; // padding data height
            
            for (let c = 0; c < dataList.length; c++) {
                let data = dataList[c];
                let paddingData = [];
                for (let y = 0; y < this.PH; y++)
                    paddingData[y] = [];

                // TOP & BOTTOM
                for (let y = 0; y < this.paddingSize; y++) {
                    for (let x = 0; x < this.PW; x++) {
                        paddingData[y][x] = 0;
                        paddingData[this.PH-y-1][x] = 0;
                    }
                } // end for paddingSize
                
                // LEFT & RIGHT
                for (let x = 0; x < this.paddingSize; x++) {
                    for (let y = 0; y < this.PH; y++) {
                        paddingData[y][x] = 0;
                        paddingData[y][this.PW-x-1] = 0;
                    }
                } // end for paddingSize
                
                // Data
                for (let y = 0, py = this.paddingSize; y < this.IH; y++, py++) {
                    for (let x = 0, px = this.paddingSize; x < this.IW; x++, px++)
                        paddingData[py][px] = data[y][x];
                } // end for paddingSize
                
                paddingDataList.push(paddingData);
            }
            
            dataList = paddingDataList;
        } // end if padding
        this.uDataList = dataList;
        
        // Convolution
        let indexX, indexY;
        this.zDataList = [];
        for (let c = 0; c < this.filterInfo.num; c++) {
            let weight = this.weightList[c];
            let bias = this.biasList[c];
            let channel = [];
            
            for (let p = 0; p < this.CH; p++) {
                indexY = p * this.stride;
                
                channel[p] = [];
                for (let q = 0; q < this.CW; q++) {
                    indexX = q * this.stride;
                    
                    channel[p][q] = 0;
                    for (let z = 0; z < this.filterInfo.depth; z++) {
                        for (let y = 0; y < this.filterInfo.height; y++) {
                            for (let x = 0; x < this.filterInfo.width; x++)
                                channel[p][q] += dataList[z][indexY + y][indexX + x] * weight[z][y][x];
                        }
                    } // end for filter depth
                    
                    channel[p][q] += bias;
                } // end for channel width
            } // end for channel height
            
            this.zDataList.push(channel);
        } // end for filter num
        
        // Activation
        let outputList = [];
        for (let c = 0; c < this.filterInfo.num; c++) {
            outputList[c] = [];
            for (let y = 0; y < this.CH; y++) {
                outputList[c][y] = [];
                for (let x = 0; x < this.CW; x++)
                    outputList[c][y][x] = this.ReLU(this.zDataList[c][y][x]);
            }
        }
        
        return outputList;
    },
    backward: function (deltaList) {
		let zDeltaList = [];
		
		// Activation diff
        for (let c = 0; c < this.filterInfo.num; c++) {
            zDeltaList[c] = [];
            for (let y = 0; y < this.CH; y++) {
                zDeltaList[c][y] = [];
                for (let x = 0; x < this.CW; x++)
                    zDeltaList[c][y][x] = this.ReLU_diff(this.zDataList[c][y][x]) * deltaList[c][y][x];
            }
        }
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		// create delta value
		let uDeltaList = [];
		for (let z = 0; z < this.filterInfo.depth; z++) {
			uDeltaList[z] = [];
			for (let y = 0; y < this.PH; y++) {
				uDeltaList[z][y] = [];
				for (let x = 0; x < this.PW; x++)
					uDeltaList[z][y][x] = 0;
			}
		}
		
		// Convolution diff
        for (let c = 0; c < this.filterInfo.num; c++) {
            let weight = this.weightList[c];
            let bias = this.biasList[c];
            
			let indexY, indexX;
            for (let p = 0; p < this.CH; p++) {
                indexY = p * this.stride;
                
                for (let q = 0; q < this.CW; q++) {
                    indexX = q * this.stride;
                    
                    for (let z = 0; z < this.filterInfo.depth; z++) {
                        for (let y = 0; y < this.filterInfo.height; y++) {
                            for (let x = 0; x < this.filterInfo.width; x++)
                                uDeltaList[z][indexY + y][indexX + x] += zDeltaList[c][p][q] * weight[z][y][x];
                        }
                    } // end for filter depth
                    
                } // end for channel width
            } // end for channel height
        } // end for filter num
		
		// extract data range
		if (this.paddingSize > 0) {
            let inDeltaList = [];
            
            for (let z = 0; z < this.filterInfo.depth; z++) {
				inDeltaList[z] = [];
				for (let y = 0, py = this.paddingSize; y < this.IH; y++, py++) {
					inDeltaList[z][y] = [];
					for (let x = 0, px = this.paddingSize; x < this.IW; x++, px++)
						inDeltaList[z][y][x] = uDeltaList[z][py][px];
				}
			}
			
			uDeltaList = inDeltaList;
        } // end if padding
		
		//＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊//
		// create weight delta value
		let weightDeltaList = [];
		let biasDeltaList = [];
		for (let c = 0; c < this.filterInfo.num; c++) {
			let weightDelta = [];
			
			for (let z = 0; z < this.filterInfo.depth; z++) {
				weightDelta[z] = [];
				for (let y = 0; y < this.filterInfo.height; y++) {
					weightDelta[z][y] = [];
					for (let x = 0; x < this.filterInfo.width; x++)
						weightDelta[z][y][x] = 0;
				}
			}
			
			weightDeltaList.push(weightDelta);
			biasDeltaList[c] = 0;
		}
		
		// calc weigt delta
        for (let c = 0; c < this.filterInfo.num; c++) {
            let indexX, indexY;
            for (let p = 0; p < this.CH; p++) {
                indexY = p * this.stride;
                
                for (let q = 0; q < this.CW; q++) {
                    indexX = q * this.stride;
                    
                    for (let z = 0; z < this.filterInfo.depth; z++) {
                        for (let y = 0; y < this.filterInfo.height; y++) {
                            for (let x = 0; x < this.filterInfo.width; x++)
								weightDeltaList[c][z][y][x] += zDeltaList[c][y][x] * this.uDataList[z][indexY + y][indexX + x];
                        }
                    } // end for filter depth
                    
                } // end for channel width
            } // end for channel height
			
        } // end for filter num
		
		// calc bias delta
		
		for (let c = 0; c < this.filterInfo.num; c++) {
			for (let y = 0; y < this.filterInfo.height; y++) {
				for (let x = 0; x < this.filterInfo.width; x++)
					biasDeltaList[c] += zDeltaList[c][y][x];
			}
        } // end for filter num
		
		// weight update
		for (let c = 0; c < this.filterInfo.num; c++) {
			for (let z = 0; z < this.filterInfo.depth; z++) {
				for (let y = 0; y < this.filterInfo.height; y++) {
					for (let x = 0; x < this.filterInfo.width; x++)
						this.weightList[c][z][y][x] += -this.ETA * weightDeltaList[c][z][y][x];
				}
			}
			this.biasList[c] += -this.ETA * biasDeltaList[c];
		}
		
        return uDeltaList;
    },
    
    ReLU: function (x) {
        return Math.max(x, 0.0);
    },
    ReLU_diff: function (x) {
        return (x > 0) ? 1 : 0.0;
    }
}