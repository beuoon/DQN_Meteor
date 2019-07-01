let Network = function () {
    this.layers = []
}
Network.prototype = {
    addLayer: function (layer) {
        this.layers.push(layer);
    },
	clone: function () {
		let network = new Network();
		for (let i = 0; i < this.layers.length; i++)
			network.addLayer(this.layers[i].clone());
		return network;
	},
	
    forward: function(data) {
        for (let i = 0; i < this.layers.length; i++)
            data = this.layers[i].forward(data);
        return data;
    },
    backward: function(delta) {
        for (let i = this.layers.length - 1; i >= 0; i--)
            delta = this.layers[i].backward(delta);
    }
}
