package ANN;

public class ErrorLayer_MSE extends ErrorLayer {
    public Data calc(Data outputList, Data labelList) {
        Data errorList = new Data();
        int layerSize = outputList.getFlat(0).length;
        
        for (int bt = 0; bt < outputList.size(); bt++) {
            double[] output = outputList.getFlat(bt);
            double[] label = labelList.getFlat(bt);
            double[] error = new double[layerSize];
            
            for (int i = 0; i < layerSize; i++)
                error[i] = 0.5 * Math.pow(label[i] - output[i], 2);
            errorList.add(error);
        }
        
        return errorList;
    }
    
    public Data diff(Data outputList, Data labelList) {
        Data diffList = new Data();
        int layerSize = outputList.getFlat(0).length;
        
        for (int bt = 0; bt < outputList.size(); bt++) {
            double[] output = outputList.getFlat(bt);
            double[] label = labelList.getFlat(bt);
            double[] diff = new double[layerSize];
            
            for (int i = 0; i < layerSize; i++)
                diff[i] = output[i] - label[i];
            diffList.add(diff);
        }
        
        return diffList;
    }
}