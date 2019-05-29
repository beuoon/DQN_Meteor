package ANN;

abstract class Layer {
    public abstract Data forward(Data dataList);
    public abstract Data backward(Data deltaList);
}
