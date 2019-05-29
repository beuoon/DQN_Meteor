package ANN;

import java.util.ArrayList;

public class Network {
    private ArrayList<Layer> layers = new ArrayList<Layer>();
    private ErrorLayer errorLayer;
    
    public Network() {}
    
    public void addLayer(Layer layer) {
        layers.add(layer);
    }
    public void setErrorLayer(ErrorLayer layer) {
        errorLayer = layer;
    }
    
    public Data predict(Data data) {
        return forward(data);
    }
    public void train(Data data, Data label) {
        data = forward(data);
        data = errorLayer.diff(data, label);
        backward(data);
    }
    public double evaluate(Data data, Data label) {
        data = forward(data);
        data = errorLayer.calc(data, label);
        
        int errorWidth = data.get(0)[0].length,
            errorHeight = data.get(0).length;
        
        double errorAvrg = 0;
        for (int bt = 0; bt < data.size(); bt++) {
            double[][] error = data.get(bt);
            
            for (int i = 0; i < errorHeight; i++) {
                for (int j = 0; j < errorWidth; j++)
                    errorAvrg += error[i][j];
            }
        }
        errorAvrg /= data.size() * errorWidth * errorHeight;
        
        return errorAvrg;
    }
    
    private Data forward(Data data) {
        for (int i = 0; i < layers.size(); i++)
            data = layers.get(i).forward(data);
        return data;
    }
    private void backward(Data data) {
        for (int i = layers.size() - 1; i >= 0; i--)
            data = layers.get(i).backward(data);
    }
}
