package ANN;

abstract class Layer {
	protected final double ETA = 0.05;
    public abstract Data forward(Data dataList);
    public abstract Data backward(Data deltaList);
}
