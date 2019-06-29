let Layer_LeackyReLU = function () {
    this.input;
}

Layer_LeackyReLU.prototype = {
	clone: function () {
		return new Layer_LeackyReLU();
	},
	
    forward: function (data) {
		let output = [];
		this.input = data.slice();
		
		for (let i = 0; i < this.input.length; i++)
			output[i] = Math.max(this.input[i], 0.01 * this.input[i]);
		
		return output;
    },
    backward: function (delta) {
		let output = [];
		
		for (let i = 0; i < this.input.length; i++)
			output[i] = ((this.input[i] >= 0) ? 1 : 0.01) * delta[i];
		
		return output;
    }
}