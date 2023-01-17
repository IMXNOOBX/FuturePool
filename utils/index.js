module.exports = function(app) {
    let modules = {};
    
	modules.remove_duplicates = function(arr) {
		let unique_array = []
		for (let i = 0; i < arr.length; i++) {
			if (unique_array.indexOf(arr[i]) == -1) {
				unique_array.push(arr[i])
			}
		}
		return unique_array
	}

    return modules
}