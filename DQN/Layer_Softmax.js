package ANN;

public class Layer_Softmax extends Layer {
    public Data forward(Data dataList) {
        Data outputList = new Data();
        Data inputList = dataList;
        int layerSize = inputList.getFlat(0).length;
        
        for (int bt = 0; bt < inputList.size(); bt++) {
            double[] input = inputList.getFlat(bt);
            double[] output = new double[layerSize];
            
            double max = input[0];
            for (int i = 0; i < layerSize; i++)
                if (max < input[i]) max = input[i];
            
            double total = 0;
            for (int i = 0; i < layerSize; i++)
                total += Math.exp(input[i] - max);
            
            for (int i = 0; i < layerSize; i++)
                output[i] = Math.exp(input[i] - max) / total;
            
            outputList.add(output);
        }
        
        return outputList;
    }
    public Data backward(Data delta) {
        return delta;
    }
}