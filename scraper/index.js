
module.exports = async function(app) {
    const scraper_utils = require('./utils')(app);

    let db = app.get('db')
    let log = app.get('log')
    let utils = app.get('utils')
    let config = app.get('config')
    let schedule = app.get('schedule')
	
    async function scrape_proxies() {
        if (!config.validator.recheck_proxies) {
            // await db.query(`DELETE FROM proxies_http;`);
            // await db.query(`DELETE FROM proxies_socks4;`);
            // await db.query(`DELETE FROM proxies_socks5`);
        }
        for (let i = 0; i < config.proxy_pools.length; i++) {
            let result = {
                type: type,
                proxies: []
            }
            if (config.validator.recheck_proxies) {
                let type
                switch (i) {
                    case 0:
                        type = 'http'
                        break;
                    case 1:
                        type = 'socks4'
                        break;
                    case 2:
                        type = 'socks5'
                        break;
                    default:
                        // await db.query(`DELETE FROM proxies_http;`);
                        // await db.query(`DELETE FROM proxies_socks4;`);
                        // await db.query(`DELETE FROM proxies_socks5`);
                        config.validator.recheck_proxies = false
                        i = -1
                        continue;
                }

                result = scraper_utils.get_from_database(type)
                log.console('['+i+'] Proxy recheck is enabled, downloading ' + type + ' and checking them again.')
            } else {
                result = await scraper_utils.download_proxies(config.proxy_pools[i])
            }

            if (!result) {
                log.error('Could not download proxies from ' + config.proxy_pools[i]?.url + ' please remove it or fix the url manually')
                continue;
            }

            if (config.validator.recheck_proxies) console.log(`${i} > ${result.type}, ${result.proxies}`)

            return

            scraper_utils.clean_database_duplicates(result.type, result.proxies, config.validator.recheck_proxies,  function(new_proxies) {
                if (!new_proxies) return log.error('Could not check if there were any duplicated proxies')
                if (new_proxies.length === 0 && !config.validator.recheck_proxies) return log.error('All proxies from ' + config.proxy_pools[i].url + ' were duplicated.')

                // console.log(new_proxies)
                scraper_utils.check_proxies(result.type, new_proxies, function(working_array) { // Check if proxies are alive
                    if (!working_array) return log.error('Proxy checker returned no results')
                    if (working_array.length === 0) return log.error('No proxies from ' + config.proxy_pools[i].url + ' were working.')

                    let placeholders = Array(working_array.length).fill('(?)').join(',')
    
                    switch (result.type) {
                        case 'http':
                            db.query("INSERT INTO proxies_http (`proxy`) VALUES " + placeholders, working_array, function (error, total, fields) {
                                if (error) return log.error("Error adding http proxy to the database: " + error)
        
                                log.success(`Added ${working_array.length} http proxies to the database`);
                                // scraper_utils.check_proxies('proxies_http')
                            });
                            break;
                        case 'socks4':
                            db.query("INSERT INTO proxies_socks4 (`proxy`) VALUES " + placeholders, working_array, function (error, total, fields) {
                                if (error) return log.error("Error adding socks4 proxy to the database: " + error)
                                
                                log.success(`Added ${working_array.length} socks4 proxies to the database`);
                                // scraper_utils.check_proxies('proxies_socks4')
                            });
                            break;
                        case 'socks5':
                            db.query("INSERT INTO proxies_socks5 (`proxy`) VALUES " + placeholders, working_array, function (error, total, fields) {
                                if (error) return log.error("Error adding socks5 proxy to the database: " + error)
        
                                log.success(`Added ${working_array.length} socks5 proxies to the database`);
                                // scraper_utils.check_proxies('proxies_socks5')
                            });
                            break;  
                    }
                })
            })
        }
	}

	schedule.scheduleJob('15 * * * *', function () {  // this for 15 minutes: https://crontab.guru/#15_*_*_*_*
		scrape_proxies()
	});
	scrape_proxies()
};