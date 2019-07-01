<%@ page contentType = "text/html;charset=utf-8" %>
<%@ page import="ANN.*" %>
<%
    Network network = new Network();
    network.addLayer(new Layer_Convolution(5, 5, 1, 1, 1, 1));

    double[][][] testDataArr1 = {
        {
            {0, 1, 0},
            {1, 1, 1},
            {0, 1, 0}
        }
    };
    double[][][] testDataArr2 = {
        {
            {1, 0, 1},
            {0, 1, 0},
            {1, 0, 1}
        }
    };
    Data testData1 = new Data(testDataArr1);
    Data testData2 = new Data(testDataArr2);

    Data predictData1 = network.predict(testData1);
    Data predictData2 = network.predict(testData2);
    /*
        그러니까...
        frame이란? update를 하는 단위!
        frameInterval이란? frame간의 간격을 말한다.
        frameInterval는 장비 또는 게임의 사양에 따라 변동되는 값이다.
        또 게임 내에서 매번 같은 양의 계산을 하는 것이 아니기 때문에,
        한 게임안에서 무조건 동일한 frameInterval이 나오지 않는다는걸 유의해야 한다.
        
        이 것이 어떤 문제를 일으키는지 알아보자.
        우선, 플레이어의 입력을 보자.
        플레이어의 입력은 frame내에서 일어나기 때문에 frameInterval이 곧 입력 간격으로 볼 수 있다.
        이는 장비의 차이가 컨트롤의 불공평함을 갖다 준다고 볼 수 있다.
        
        두번째로 오브젝트 처리에 대해 보자.
        만약 어떠 한 오브젝트를 frame당 2씩 오른쪽으로 움직인다고 해보자.
        이렇게 할 경우 frameInterval에 따라 달라지는 1초당 frame수. 즉, fps에 따라 1초당 오브젝트의 이동거리가 달라진다.
        심각한 문제이긴 하지만 후술할 시간단위의 이동에서 발생하는 충돌 등의 문제에서는 벗어날 수 있다.
        
        위의 방법에 대한 대처법으로 시간단위의 이동법이 있다.
        frame 단위로 오브젝트가 이동하는게 아니라, 시간단위로 오브젝트가 이동하는 것이다.
        이렇게 할 경우 fps가 달라져도, 1초당 오브젝트의 이동거리는 같아진다.
        하지만 렉이 걸려 긴 거리의 이동을 한번에 할 경우 충돌처리가 제대로 되지 않는다.
        
        현재 개발하는 DQN의 경우 매 프레임마다 신경망의 계산이 필요하기 때문에 frameInterval이 매우 길어진다.
        따라서, 후자의 방법으로 개발할 경우 충돌처리와 제대로된 게임 플레이가 불가능하다.
        그러므로 전자의 방법으로 개발을 해야 하는데, fps가 너무 낮기 때문에 특단의 조치가 필요하다.
        
        게임의 플레이는 백그라운드로 진행하고, 화면에는 계산이 다 끝난 리플레이 화면을 보여준다.
        
        현 상황에서는 전자의 방법으로 한다지만, 일반적인 상황에서는 어떨까?
        일단 후자의 경우 렉 걸렸을 때의 문제가 명백하다. 이와 같은 경우
        물리 처리를 계산하는 최소의 frameTime을 준 후에 deltaTime을 그 frameTime으로 잘게 나누어서 물리 계산을 한다.
        기타 발생할 수 있는 문제는 아래를 참고하자.
        참고: http://rapapa.net/?p=381

        그렇다면 전자의 경우를 생각해보자.
        fps가 낮은 경우는 그저 렉만 걸리기 때문에 문제가 되지 않는다.
        fps가 높을 경우, 게임의 속도가 의도한 것보다 빨라질 수 있다. 이건 fps를 제한함으로써 해결할 수 있다.
        만약 60fps와 144fps 같이 여러 fps를 지원하고 싶다면, 음...
        frame마다의 이동거리를 fps에 따라 변동시키던가, 이동과 frame을 분리하면 된다.(??) 
        
        또한 게임의 두배속과 같은 기능을 처리하기가... 쉽다.! 한 프레임에서 update를 두번해주면 된다.
        오잉??
    */
%>

<html>
	<head>
		<link rel="stylesheet" type="text/css" href="main.css">
	</head>
	<body>
<%--
        결과1 : 
        <%
            for (int i = 0; i < predictData1.size(); i++) {
                double[][] predict = predictData1.get(i);
                for (int j = 0; j < predict.length; j++) {
                    for (int k = 0; k < predict[j].length; k++)
                    %><%= String.format("%.5f ", predict[j][k]) %>
                <br>
                <%
                } 
            }
        %>
        결과2 : 
        <%
            for (int i = 0; i < predictData2.size(); i++) {
                double[][] predict = predictData2.get(i);
                for (int j = 0; j < predict.length; j++) {
                    for (int k = 0; k < predict[j].length; k++)
                    %><%= String.format("%.5f ", predict[j][k]) %>
                <br>
                <%
                } 
            }
        %>
--%>
		
		<canvas id="mainCanvas"></canvas><br>
        <br>
		
        <script src="DQN/ErrorLayer_MSE.js"></script>
        <script src="DQN/Layer_LeackyReLU.js"></script>
        <script src="DQN/Layer_ReLU.js"></script>
        <script src="DQN/Layer_Linear.js"></script>
        <script src="DQN/Layer_Flatten.js"></script>
        <script src="DQN/Layer_Convolution.js"></script>
        <script src="DQN/Network.js"></script>
        <script src="DQN/DQN.js"></script>
        
		<script src="util.js"></script>
		<script src="Player.js"></script>
		<script src="Star.js"></script>
		<script src="main.js"></script>
	</body>
</html>