let Layer_ReLU = function () {
    this.input;
}

Layer_ReLU.prototype = {
    forward: function (data) {
		let output = [];
		this.input = data;
		
		for (let i = 0; i < this.input.length; i++)
			output[i] = Math.max(this.input[i], 0);
		
		return output;
    },
    backward: function (delta) {
		let output = [];
		
		for (let i = 0; i < this.input.length; i++)
			output[i] = (this.input[i] > 0) ? delta[i] : 0;
		
		return output;
    }
}