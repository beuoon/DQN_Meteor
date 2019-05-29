package ANN;

public class Layer_LeackyReLU extends Layer {
    private int layerSize;
    private Data inputList;
    
    public Data forward(Data dataList) {
        Data outputList = new Data();
        inputList = dataList;
        layerSize = inputList.getFlat(0).length;
        
        for (int bt = 0; bt < inputList.size(); bt++) {
            double[] input = inputList.getFlat(bt);
            double[] output = new double[layerSize];
            
            for (int i = 0; i < layerSize; i++)
                output[i] = Math.max(input[i], 0.01 * input[i]);
            
            outputList.add(output);
        }
        
        return outputList;
    }
    public Data backward(Data deltaList) {
        Data outputList = new Data();
        
        for (int bt = 0; bt < deltaList.size(); bt++) {
            double[] input = inputList.getFlat(bt);
            double[] output = new double[layerSize];
            double[] delta = deltaList.getFlat(bt);
            
            for (int i = 0; i < layerSize; i++)
                output[i] = ((input[i] >= 0) ? 1 : 0.01) * delta[i];
            
            outputList.add(output);
        }
        
        return outputList;
        /*
            u1 = x1 * w1;
            x2 = f(u1);
            x3 = x2 * w2;
            
            
            e = 1/2(t - x3)^2
            object: de/dw
            
            de/dx3 = (t - x3);
            
            de/dw2 = de/dx3 * dx3/dw2 = (t - x3) * x2;
            de/dx2 = de/dx3 * dx3/dx2 = (t - x3) * w2;
            
            de/du1 = de/dx2 * dx2/du1 = (t - x3)*w2 * f'(u1);
            
        */
    }
}