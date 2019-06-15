let ErrorLayer_MSE = function () {
}
ErrorLayer_MSE.prototype = {
	calc: function (output, label) {
		let error = [];
		let layerSize = output.length;

		for (let i = 0; i < layerSize; i++)
			error[i] = 0.5 * Math.pow(label[i] - output[i], 2);

		return error;
    },
    
    diff: function (output, label) {
        let diff = [];
        let layerSize = output.length;
        
		for (let i = 0; i < layerSize; i++)
			diff[i] = output[i] - label[i];
        
        return diff;
    }
}