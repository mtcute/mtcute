export function load(app) {
    app.converter.addUnknownSymbolResolver((declaration) => {
        const symbol = declaration.symbolReference?.path?.map(path => path.path).join('.')

        if (symbol === 'Long' || symbol === 'tl.Long') {
            return {
                target: 'https://github.com/dcodeIO/long.js',
                caption: symbol,
            }
        }

        if (symbol.startsWith('tl.')) {
            let [ns, name] = symbol.slice(3).split('.')

            if (!name) {
                name = ns
                ns = null
            }

            let kind

            if (name.startsWith('Type')) {
                kind = 'union'
                name = name.slice(4)
            } else if (name.startsWith('Raw')) {
                name = name[3].toLowerCase() + name.slice(4)

                if (name.endsWith('Request')) {
                    kind = 'method'
                    name = name.slice(0, -7)
                } else {
                    kind = 'class'
                }
            }

            name = (ns ? `${ns}.` : '') + name

            let url

            switch (kind) {
                case 'union':
                    url = `https://core.telegram.org/type/${name}`
                    break
                case 'method':
                    url = `https://core.telegram.org/method/${name}`
                    break
                case 'class':
                    url = `https://core.telegram.org/constructor/${name}`
                    break
            }

            return {
                target: url,
                caption: symbol,
            }
        }
    })
}
