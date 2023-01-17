module.exports = function(app) {
    let modules = {}
    let db = app.get('db')
    let log = app.get('log')
    let utils = app.get('utils')
    let config = app.get('config')
    let axios = app.get('axios')

	modules.remove_duplicates = function(arr) {
		let unique_array = []
		for (let i = 0; i < arr.length; i++) {
			if (unique_array.indexOf(arr[i]) == -1) {
				unique_array.push(arr[i])
			}
		}
		return unique_array
	}

    modules.clean_database_duplicates = async function(type, arr, _callback) {
		let unique_array = []
		let database_array = []

        await db.query(`SELECT * FROM proxies_${type};`, function (error, result, fields) {
            if (error) return false
            
            result.forEach(proxy => {
                database_array.push(proxy['proxy']);
            })

            for (let i = 0; i < arr.length; i++) {                
                if (database_array.indexOf(arr[i]) == -1) {
                    unique_array.push(arr[i])
                }
            }

            log.console('Finished checking for duplicates, removed: '+ (arr.length - unique_array.length))
            _callback(unique_array)
        });
	}

	modules.download_proxies = async function(list) {
        const _proxies = [];

        let url = list.url; // list[i].url;
        let raw = list.raw; // list[i].raw;
        let type = list.type; // list[i].type;

        let replacable = list.replacable; // list[i].type;
        let replace = list[replacable]
        let recursive = list.recursive; //list[i].recursive;

        let recursive_loop = 0; 

        let request
        do {
            log.console(`Downloading ${recursive ? url.replace(`{${replacable}}`, replace[recursive_loop]) : url} proxy list`)

            request = await axios({
                url: recursive ? url.replace(`{${replacable}}`, replace[recursive_loop]) : url,
                method: "GET"
            })

            if (!request.data || request?.status !== 200)
                break;

            if (raw) {
                request.data.split("\n").forEach(proxy => { // if we dont do this it will push the lists as an array
                    _proxies.push(proxy);
                })
            } else {
                request.data.match(config.scraper.proxy_regex).forEach(proxy => {
                    _proxies.push(proxy);
                })
            }
            log.console(`[${recursive_loop}] downloaded a total of ${_proxies.length} proxies`)

            recursive_loop++
        } while (recursive && recursive_loop < replace.length && request?.status === 200)

        if(_proxies.lenght === 0)
            return false

        let clean_list = this.remove_duplicates(_proxies) 
        
        return {
            proxies: clean_list,
            type: type
        }

	}

    modules.check_proxies = async function() {
		let working_array = []
		let database_array = []

        await db.query(`SELECT * FROM proxies_http`, async function (error, result, fields) {
            if (error) return false
            
            result.forEach(proxy => {
                database_array.push(proxy['proxy']);
            })

            for (let i = 0; i < database_array.length; i++) {    
                let proxy = database_array[i].split(':');            
                let request = await axios({
                    url: 'http://ip-api.com/json',
                    method: "GET",
                    proxy: {
                        protocol: 'http',
                        host: proxy[0],
                        port: proxy[1]
                    }
                })

                if (request && request?.status === 200) working_array.push(database_array[i])
            }

            log.console('Finished checking proxies, removed: '+ (working_array.length - database_array.length))
            return working_array
        });
	}

    return modules
};