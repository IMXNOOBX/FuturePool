module.exports = function(app) {
    let modules = {}
    let db = app.get('db')
    let log = app.get('log')
    let utils = app.get('utils')
    let config = app.get('config')
    let axios = app.get('axios')
    let spa = app.get('spa')

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

        let response
        do {
            log.console(`Downloading ${recursive ? url.replace(`{${replacable}}`, replace[recursive_loop]) : url} proxy list`)

            response = await axios({
                url: recursive ? url.replace(`{${replacable}}`, replace[recursive_loop]) : url,
                method: "GET"
            })

            // console.log(response.data)
            if (!response.data || response?.status !== 200)
                break;

            if (raw) {
                response.data.split("\n").forEach(proxy => { // if we dont do this it will push the lists as an array
                    _proxies.push(proxy);
                })
            } else {
                response.data.match(config.scraper.proxy_regex).forEach(proxy => {
                    _proxies.push(proxy);
                })
            }
            log.console(`[${recursive_loop}] downloaded a total of ${_proxies.length} proxies`)

            recursive_loop++
        } while (recursive && recursive_loop < replace.length && response?.status === 200)

        if(_proxies.lenght === 0)
            return false

        let clean_list = this.remove_duplicates(_proxies) 
        
        return {
            proxies: clean_list,
            type: type
        }

	}

    // modules.check_proxies = async function(type) {
    //     console.log("Checking proxies...")
	// 	let working_array = []
	// 	let database_array = []
        
    //     await db.query(`SELECT * FROM ${type}`, async function (error, result, fields) {
    //         if (error) return false
    //         console.log("Downloaded proxies from database.")
    //         // console.log(result)

    //         result.forEach(proxy => {
    //             // console.log(proxy['proxy'])
    //             database_array.push(proxy['proxy']);
    //         })

    //         console.log("Checking proxies")
    //         for (let i = 0; i < database_array.length; i++) {    
    //             let tocheck_proxy = database_array[i].split(':');
    //             console.log("Checking proxy: " + database_array[i])

    //             axios({
    //                 url: 'http://ip-api.com/json',
    //                 method: "GET",
    //                 proxy: {
    //                     protocol: 'http',
    //                     host: tocheck_proxy[0],
    //                     port: tocheck_proxy[1]
    //                 },
    //                 timeout: config.scraper.timeout || 5000
    //             })
    //             .then((response) => {
    //                 if (response && response?.status === 200) {
    //                     console.log("Response to proxy" + database_array[i] + " returned " + response?.data)
    //                     working_array.push(database_array[i])
    //                 }
    //             })
    //             .catch(err => { console.log("Proxy: " + database_array[i] + " timed out")  })
    //         }

    //         log.console('Finished checking proxies, removed: '+ (working_array.length - database_array.length))
    //         return working_array
    //     });
	// }

    modules.check_proxies = async function (type, tocheck_array, _callback) {
        let working_array = [];

        console.log(`${type} - Checking proxies ${tocheck_array.length}`)
        var proms = [];
        switch (type) {
            case 'http':
                for (let i = 0; i < tocheck_array.length; i++) {
                    let tocheck_proxy = tocheck_array[i].split(":"); if (!tocheck_proxy[0] || !tocheck_proxy[1]) continue;
                    proms.push(
                        axios({
                        url: config.scraper.check_dom || "https://google.com",
                        method: "GET",
                        proxy: {
                            protocol: "http",
                            host: tocheck_proxy[0],
                            port: tocheck_proxy[1],
                        },
                        timeout: config.scraper.timeout || 5000,
                        }).then((response) => {
                            console.log(tocheck_array[i] + " -> " + response.status)
                            if (response && response?.status === 200) {
                                working_array.push(tocheck_array[i]);
                                return database_array[i]
                            }
                        }).catch((err) => { })
                    )
                  }
                break;
            case 'socks4':
                for (let i = 0; i < tocheck_array.length; i++) {
                    let tocheck_proxy = tocheck_array[i].split(":"); if (!tocheck_proxy[0] || !tocheck_proxy[1]) continue;
                    // console.log(`Proxy: ${tocheck_array[i]} agent:  socks4://${tocheck_proxy[0]}:${tocheck_proxy[1]}`)
                    // const httpsAgent = new spa(`socks4://${tocheck_proxy[0]}:${tocheck_proxy[1]}`);
                    const client = axios.create({
                        baseURL: config.scraper.check_dom || "https://google.com", 
                        httpsAgent: new spa(`socks4://${tocheck_proxy[0]}:${tocheck_proxy[1]}`),
                        timeout: config.scraper.timeout || 5000,
                    });

                    proms.push(
                        client.get('/').then((response) => {
                            console.log("socks4" + tocheck_array[i] + " -> " + response.status)
                            if (response && response?.status === 200) {
                                working_array.push(tocheck_array[i]);
                                return database_array[i]
                            }
                        }).catch((err) => { })
                    )
                }
                break;
            case 'socks5':
                for (let i = 0; i < tocheck_array.length; i++) {
                    let tocheck_proxy = tocheck_array[i].split(":"); if (!tocheck_proxy[0] || !tocheck_proxy[1]) continue;
                    // const httpsAgent = new spa(`socks5://${tocheck_proxy[0]}:${tocheck_proxy[1]}`);
                    const client = axios.create({
                        baseURL: config.scraper.check_dom || "https://google.com", 
                        httpsAgent: new spa(`socks5://${tocheck_proxy[0]}:${tocheck_proxy[1]}`),
                        timeout: config.scraper.timeout || 5000,
                    });
                    proms.push(
                        client.get('/').then((response) => {
                            console.log("socks5" + tocheck_array[i] + " -> " + response.status)
                            if (response && response?.status === 200) {
                                working_array.push(tocheck_array[i]);
                                return tocheck_array[i]
                            }
                        }).catch((err) => { })
                    )
                  }
                break;
        }

        await Promise.all(proms).then(function (results) {
            log.console(
                "Finished checking proxies, removed: " +
                (tocheck_array.length - working_array.length)
            );
            _callback(working_array);
        });
    };

    return modules
};