module.exports = {
    debug: true,
    log_webhook: "https://discord.com/api/webhooks/1064867895676522547/IfRoA67qIvOA10VDqOtDBc4hhmgqdktHwcoHpFNd1GmRnpe8rrdLZhod0KG04pEgbQc7", // webhook to a private discord server where you will receive debug logs

    validator: {
        recheck_proxies: true, // check last pool proxies again if they are still alive or not
    },

    scraper: {
        check_dom: "http://ip-api.com/json", // "https://google.com",
        timeout: 30000,
        proxy_regex: /(?<!\d)([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3}(:\d{1,5})?(?!\d)/g // https://stackoverflow.com/a/63403973
    },

    output: {
        rest_api: true,
        file: true
    },

    proxy_pools: [
        {
            url: "https://raw.githubusercontent.com/BlackSnowDot/proxylist-update-every-minute/main/socks.txt", // raw porxy url
            raw: true,
            recursive: false, // use {page} to download proxies from pages that limit its size
            type: "socks4" // proxy type: socks4, socks5, http
        },
        {
            url: "http://proxydb.net/?protocol=socks4&country={country}", // raw porxy url
            raw: false,
            recursive: true, // use {type} to download proxies from pages that limit its size or filter by countries
            replacable: "country",
            country: ["", "AL", "AR", "BD", "BR", "CA", "CO", "ES", "DE", "IT", "MX", "NL", "PL", "US", "GB"],
            type: "socks4" // proxy type: socks4, socks5, http
        },
        {
            url: "http://proxydb.net/?protocol=http&country={country}", // raw porxy url
            raw: false,
            recursive: true, // use {type} to download proxies from pages that limit its size or filter by countries
            replacable: "country",
            country: ["", "AL", "AR", "BD", "BR", "CA", "CO", "ES", "DE", "IT", "MX", "NL", "PL", "US", "GB"],
            type: "http" // proxy type: socks4, socks5, http
        },
        {
            url: "https://raw.githubusercontent.com/mertguvencli/http-proxy-list/main/proxy-list/data.txt", // raw porxy url
            raw: true,
            recursive: false, // use {type} to download proxies from pages that limit its size or filter by countries
            type: "http" // proxy type: socks4, socks5, http
        }
    ],
    
    api: {
        port: 4006,
        authorization: true,
        key: [""],
        rate_limit: 100, // Per minute
    },

    db: {
        host: "localhost",
        user: "root",
        password: "",
        database: "test_db"
    }
}