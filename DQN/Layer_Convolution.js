let Layer_Convolution = function (filterInfo, stride=1, paddingSize=0) {
    this.ETA = 0.005;
    
    this.filterInfo = filterInfo;
    this.stride = stride, this.paddingSize = paddingSize;
    
    this.weightList = [];
    this.biasList = [];
    
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
        
        let bias = (Math.random() * 2 - 1) * weightLimit;
            
        this.weightList.push(weight);
        this.biasList.push(bias);
    }
}

Layer_Convolution.prototype = {
    forward: function (dataList) {
        let IW = dataList[0][0].length, // input width
            IH = dataList[0].length; // input height

        let CW = (IW + 2*this.paddingSize - this.filterInfo.width)/this.stride + 1, // channel width
            CH = (IH + 2*this.paddingSize - this.filterInfo.height)/this.stride + 1; // chanel height
        
        // Zero Padding
        if (this.paddingSize > 0) {
            let paddingDataList = [];
            let DW = IW + 2*this.paddingSize, // padding data width
                DH = IH + 2*this.paddingSize; // padding data height
            
            for (let c = 0; c < dataList.length; c++) {
                let data = dataList[c];
                let paddingData = [];
                for (let y = 0; y < DH; y++)
                    paddingData[y] = [];

                // TOP & BOTTOM
                for (let y = 0; y < this.paddingSize; y++) {
                    for (let x = 0; x < DW; x++) {
                        paddingData[y][x] = 0;
                        paddingData[DH-y-1][x] = 0;
                    }
                } // end for paddingSize
                
                // LEFT & RIGHT
                for (let x = 0; x < this.paddingSize; x++) {
                    for (let y = 0; y < DH; y++) {
                        paddingData[y][x] = 0;
                        paddingData[y][DW-x-1] = 0;
                    }
                } // end for paddingSize
                
                // Data
                for (let y = 0, py = this.paddingSize; y < IH; y++, py++) {
                    for (let x = 0, px = this.paddingSize; x < IW; x++, px++)
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
            
            for (let p = 0; p < CH; p++) {
                indexY = p * this.stride;
                
                channel[p] = [];
                for (let q = 0; q < CW; q++) {
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
            for (let y = 0; y < CH; y++) {
                outputList[c][y] = [];
                for (let x = 0; x < CW; x++)
                    outputList[c][y][x] = this.ReLU(this.zDataList[c][y][x]);
            }
        }
        
        return outputList;
    },
    backward: function (deltaList) {
        return deltaList;
    },
    
    ReLU: function (x) {
        return Math.max(x, 0);
    },
    ReLU_diff: function (x) {
        return (x > 0) ? 1 : 0;
    }
}