
module.exports = async function(app) {
    const scraper_utils = require('./utils')(app);

    let db = app.get('db')
    let log = app.get('log')
    let utils = app.get('utils')
    let config = app.get('config')
    let schedule = app.get('schedule')
	
    async function scrape_proxies() {
        for (let i = 0; i < config.proxy_pools.length; i++) {
            let result = await scraper_utils.download_proxies(config.proxy_pools[i])

            if (!result) return log.error('Could not download proxies from ' + config.proxy_pools[i].url + ' please remove it or fix the url manually')

            scraper_utils.clean_database_duplicates(result.type, result.proxies, function(new_proxies) {
                if (!new_proxies) return log.error('Could not check if there were any duplicated proxies')
                if (new_proxies.length === 0) return log.error('All proxies from ' + config.proxy_pools[i].url + ' were duplicated.')
                
                let placeholders = Array(new_proxies.length).fill('(?)').join(',')
    
                switch (result.type) {
                    case 'http':
                        db.query("INSERT INTO proxies_http (`proxy`) VALUES " + placeholders, new_proxies, function (error, total, fields) {
                            if (error) return log.error("Error adding http proxy to the database: " + error)
    
                            log.success(`Added ${new_proxies.length} http proxies to the database`);
                        });
                        break;
                    case 'socks4':
                        db.query("INSERT INTO proxies_socks4 (`proxy`) VALUES " + placeholders, new_proxies, function (error, total, fields) {
                            if (error) return log.error("Error adding socks4 proxy to the database: " + error)
                            
                            log.success(`Added ${new_proxies.length} socks4 proxies to the database`);
                        });
                        break;
                    case 'socks5':
                        db.query("INSERT INTO proxies_socks5 (`proxy`) VALUES " + placeholders, new_proxies, function (error, total, fields) {
                            if (error) return log.error("Error adding socks5 proxy to the database: " + error)
    
                            log.success(`Added ${new_proxies.length} socks5 proxies to the database`);
                        });
                        break;  
                }

                scraper_utils.check_proxies()
            })
        }
	}

	schedule.scheduleJob('15 * * * *', function () {  // this for one hour: https://crontab.guru/#15_*_*_*_*
		scrape_proxies()
	});
	scrape_proxies()
};