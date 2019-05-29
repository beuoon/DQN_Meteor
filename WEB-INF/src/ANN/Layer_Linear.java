package ANN;

public class Layer_Linear extends Layer {
    private int inLayerSize, outLayerSize; // 입력 크기, 출력 크기
    private Data weightList;
    private Data inputList;
    
    private Optimizer optimizer;
    private Data weightMomentumList;
    private final double MOMENTUM_BETA = 0.9;
    
    public Layer_Linear(int inputSize, int outputSize, Optimizer opt) {
        this.inLayerSize = inputSize;
        this.outLayerSize = outputSize;
        this.optimizer = opt;
        
        weightList = new Data();
        weightMomentumList = new Data();
        
	    double weightLimit = Math.sqrt(6.0/inputSize); // He 초기화 사용 변수
        for (int i = 0; i < outLayerSize; i++) {
            double[] weight = new double[inLayerSize + 1];
            double[] weightMomentum = new double[inLayerSize + 1];
            
            for (int j = 0; j <= inLayerSize; j++) {
                weight[j] = Math.random() * 2 - 1;
                weight[j] *= weightLimit;
                
                weightMomentum[j] = 0;
            }
            
            weightList.add(weight);
            weightMomentumList.add(weightMomentum);
        }
    }
    
    public Data forward(Data dataList) {
        Data outputList = new Data();
        inputList = dataList;
        
        for (int bt = 0; bt < inputList.size(); bt++) {
            double[] input = inputList.getFlat(bt);
            double[] output = new double[outLayerSize];
            
            for (int i = 0; i < outLayerSize; i++) {
                double[] weight = weightList.getFlat(i);
                
                output[i] = 0;
                for (int j = 0; j < inLayerSize; j++)
                    output[i] += input[j] * weight[j];
                output[i] += weight[inLayerSize]; // Bias
            }
            
            outputList.add(output);
        }
        
        return outputList;
    }
    public Data backward(Data deltaList) {
        Data outputList = new Data();
        
        // Calc Delta
        for (int bt = 0; bt < deltaList.size(); bt++) {
            double[] input = inputList.getFlat(bt);
            double[] output = new double[inLayerSize];
            double[] delta = deltaList.getFlat(bt);
            
            for (int i = 0; i < inLayerSize; i++) {
                output[i] = 0;
                for (int j = 0; j < outLayerSize; j++)
                    output[i] += delta[j] * weightList.getFlat(j)[i];
            }
            
            outputList.add(output);
        }
        
        switch (optimizer) {
            case SGD:        train_SGD(deltaList);        break;
            case MOMENTUM:   train_Momentum(deltaList);   break;
        }
        
        return outputList;
    }
    
    private void train_SGD(Data deltaList) {
        for (int bt = 0; bt < deltaList.size(); bt++) {
            double[] input = inputList.getFlat(bt);
            double[] delta = deltaList.getFlat(bt);
            
            for (int i = 0; i < outLayerSize; i++) {
                double[] weight = weightList.getFlat(i);
                
                for (int j = 0; j < inLayerSize; j++)
                    weight[j] += -ETA * (delta[i] * input[j]);
                weight[inLayerSize] = -ETA * delta[i];
            }
        }
    }
    private void train_Momentum(Data deltaList) {
        for (int bt = 0; bt < deltaList.size(); bt++) {
            double[] input = inputList.getFlat(bt);
            double[] delta = deltaList.getFlat(bt);
            
            for (int i = 0; i < outLayerSize; i++) {
                double[] weight = weightList.getFlat(i);
                double[] weightMomentum = weightMomentumList.getFlat(i);
                
                for (int j = 0; j < inLayerSize; j++) {
                    weightMomentum[j] = MOMENTUM_BETA * weightMomentum[j] + (1 - MOMENTUM_BETA) * (delta[i] * input[j]);
                    weight[j] += -ETA * weightMomentum[j];
                }
                weightMomentum[inLayerSize] = MOMENTUM_BETA * weightMomentum[inLayerSize] + (1 - MOMENTUM_BETA) * delta[i];
                weight[inLayerSize] += -ETA * weightMomentum[inLayerSize];
            }
        }
    }
}