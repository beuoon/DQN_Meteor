package ANN;

import java.util.ArrayList;

public class Data extends ArrayList<double[][]> {
    public Data() {}
    public Data(double[][] datas) {
        for (int i = 0; i < datas.length; i++)
            this.add(datas[i]);
    }
    public Data(double[][][] datas) {
        for (int i = 0; i < datas.length; i++)
            this.add(datas[i]);
    }
    
    public void add(double[] data) {
        double[][] newData = new double[1][data.length];
        
        for (int i = 0; i < data.length; i++)
            newData[0][i] = data[i];
        
        this.add(newData);
    }
    public double[] getFlat(int number) {
        return this.get(number)[0];
    }
}