package ANN;

abstract class ErrorLayer {
    public abstract Data calc(Data outputList, Data labelList);
    public abstract Data diff(Data outputList, Data labelList);
}