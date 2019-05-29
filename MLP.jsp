<%@ page contentType = "text/html;charset=utf-8" %>
<%@ page import="ANN.*" %>
<%
    Network network = new Network();
    network.addLayer(new Layer_Linear(2, 3, Optimizer.MOMENTUM));
    network.addLayer(new Layer_LeackyReLU());
    network.addLayer(new Layer_Linear(3, 5, Optimizer.MOMENTUM));
    network.addLayer(new Layer_LeackyReLU());
    network.addLayer(new Layer_Linear(5, 2, Optimizer.MOMENTUM));
    network.addLayer(new Layer_Softmax());

    network.setErrorLayer(new ErrorLayer_CEE());

    double[][] testDataArr = {{0.1, 0.2}, {0.8, 0.7}, {0.2, 0.4}, {0.6, 0.9}};
    double[][] testLabelArr = {{0, 1}, {1, 0}, {0, 1}, {1, 0}};
    Data testData = new Data(testDataArr);
    Data testLabel = new Data(testLabelArr);
    
    Data predictData1 = network.predict(testData);
    double error1 = network.evaluate(testData, testLabel);

    for (int i = 0; i < 20000; i++)
        network.train(testData, testLabel);

    Data predictData2 = network.predict(testData);
    double error2 = network.evaluate(testData, testLabel);
%>

<html>
<head>
</head>
<body>
    학습 전: <%= String.format("%.5f", error1) %><br>
<%
    for (int i = 0; i < predictData1.size(); i++) {
        double[] predict = predictData1.getFlat(i);
        for (int j = 0; j < predict.length; j++) 
            %><%= String.format("%.5f ", predict[j]) %>
        <br>
        <%    
    }
%>
    
    학습 후: <%= String.format("%.5f", error2) %><br>
<%
    for (int i = 0; i < predictData2.size(); i++) {
        double[] predict = predictData2.getFlat(i);
        for (int j = 0; j < predict.length; j++) 
            %><%= String.format("%.5f ", predict[j]) %>
        <br>
        <%
    }
%>
</body>
</html>