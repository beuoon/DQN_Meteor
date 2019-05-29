package ANN;

import java.util.ArrayList;

public class Layer_Convolution extends Layer {
    private int FW, FH, FD; // filter Width, filter Height, filter Depth
    private int FN, stride, paddingSize; // Filer Num
    
    private ArrayList<double[][][]> weightList;
    private ArrayList<Double> biasList;
    private Data inputList;
    
    public Layer_Convolution(int filterWidth, int filterHeight, int filterDepth,
                             int filterNum, int stride, int paddingSize) {
        this.FW = filterWidth; this.FH = filterHeight; this.FD = filterDepth;
        this.FN = filterNum;
        this.stride = stride;
        this.paddingSize = paddingSize;
        
        double weightLimit = Math.sqrt(6.0/(FW * FH * FD));
        
        weightList = new ArrayList<double[][][]>();
        biasList = new ArrayList<Double>();
        for (int c = 0; c < FN; c++) {
            double[][][] weight = new double[FD][FH][FW];
            
            for (int z = 0; z < FD; z++) {
                for (int y = 0; y < FH; y++) {
                    for (int x = 0; x < FW; x++)
                        weight[z][y][x] = (Math.random() * 2 - 1) * weightLimit;
                }
            }
            
            double bias = (Math.random() * 2 - 1) * weightLimit;
            
            weightList.add(weight);
            biasList.add(bias);
        }
    }
    
    public Data forward(Data dataList) {
        Data outputList = new Data();
        inputList = dataList;
        
        int IW = dataList.get(0)[0].length, // input width
            IH = dataList.get(0).length; // input height
        int CW = (IW + 2*paddingSize - FW)/stride + 1, // channel width
            CH = (IH + 2*paddingSize - FH)/stride + 1; // chanel height
        
        // Zero Padding
        if (paddingSize > 0) {
            Data paddingDataList = new Data();
            int DW = IW + paddingSize*2, // padding data width
                DH = IH + paddingSize*2; // padding data height
            
            for (int c = 0; c < dataList.size(); c++) {
                double[][] data = dataList.get(c);
                double[][] paddingData = new double[DH][DW];

                // TOP & BOTTOM
                for (int y = 0; y < paddingSize; y++) {
                    for (int x = 0; x < DW; x++) {
                        paddingData[y][x] = 0;
                        paddingData[DH-y-1][x] = 0;
                    }
                } // end for paddingSize
                
                // LEFT & RIGHT
                for (int x = 0; x < paddingSize; x++) {
                    for (int y = 0; y < DH; y++) {
                        paddingData[y][x] = 0;
                        paddingData[y][DW-x-1] = 0;
                    }
                } // end for paddingSize
                
                // Data
                for (int y = 0, py = paddingSize; y < IH; y++, py++) {
                    for (int x = 0, px = paddingSize; x < IW; x++, px++)
                        paddingData[py][px] = data[y][x];
                } // end for paddingSize
                
                paddingDataList.add(paddingData);
            }
            
            dataList = paddingDataList;
        } // end if padding
        
        // Convolution
        int indexX, indexY;
        for (int c = 0; c < FN; c++) {
            double[][][] weight = weightList.get(c);
            double bias = biasList.get(c);
            double[][] output = new double[CH][CW];
            
            for (int p = 0; p < CH; p++) {
                indexY = p * stride;
                for (int q = 0; q < CW; q++) {
                    indexX = q * stride;
                    
                    output[p][q] = 0;
                    for (int z = 0; z < FD; z++) {
                        double[][] input = dataList.get(z);
                        
                        for (int y = 0; y < FH; y++) {
                            for (int x = 0; x < FW; x++)
                                output[p][q] += input[indexY + y][indexX + x] * weight[z][y][x];
                        }
                    } // end for filter depth
                    
                    output[p][q] += bias;
                    output[p][q] = ReLU(output[p][q]);
                } // end for channel width
            } // end for channel height
            
            outputList.add(output);
        } // end for filter num
        
        return outputList;
    }
    public Data backward(Data deltaList) {
        return deltaList;
    }
    
    private double ReLU(double x) {
        return Math.max(x, 0);
    }
    private double ReLU_diff(double x) {
        return (x > 0) ? 1 : 0;
    }
}