# Procss-inline

[Procss](https://github.com/vindm/procss)-plugin for inline on url().

## Features

> * Process only specific urls, matched by `/* procss.inline() */` comment

> * Can inline multiple backgrounds urls

> * Can inline svg files with URI-encode

## Usage

Install with [npm](https://npmjs.org/package/procss):
```
    $ [sudo] npm install procss-inline --save
```

Input file `a.css`:
```
.some-ico {
    background : url(some_small_image.png) /* procss.inline() */;
}
.some-ico.svg {
    background : url(some_small_image.svg) /* procss.inline() */;
}
```

Run `procss` with `procss-inline` plugin:
```
    $ procss a.css -p path/to/procss-inline
```

Check output file `a.pro.css`, it should look like this:
```
.some-ico {
    background : url(some_small_image.png);
    background : url(data:image/png;base64,...);
}
.some-ico.svg {
    background : url(some_small_image.svg);
    background : url(data:image/svg+xml;base64,PHN2ZyB4bW...);
}
```

You can URI-encode .svg file content instead of base64, by defining `enc` as first argument to css command:
Input file `a.css`:
```
.some-ico.svg {
    background : url(some_small_image.svg) /* procss.inline(enc) */;
}
```

Run `procss` with `procss-inline` plugin:
```
    $ procss a.css -p path/to/procss-inline
```

It will generate output `a.pro.css` file:
```
.some-ico.svg {
    background : url(some_small_image.svg);
    background : url(data:image/svg+xml,%3Csvg%20x...);
}
```

Checkout more examples at
 [/example](https://github.com/vindm/procss/tree/dev/example) and
 [/test](https://github.com/vindm/procss/tree/dev/test).

## Configuration

You can use `.procss.js` file to predefine plugin configs by processing input filepaths.
```
{
    plugins : [
        {
            plugin : 'procss-inline',
            config : {
                 min_input_size : 0, // Minimum input file size allowed to be inlined
                 max_input_size : 4096, // Maximum input file size allowed to be inlined
                 min_inlined_size : 0, // Minimum inlined content size allowed
                 max_inlined_size : 4096, // Maximum inlined content size allowed
                 content_types : { // Content-types to use
                     '.gif' : 'image/gif',
                     '.jpg' : 'image/jpeg',
                     '.png' : 'image/png',
                     '.svg' : 'image/svg+xml',
                     '.ttf' : 'application/x-font-ttf',
                     '.woff' : 'application/x-font-woff'
                 }
             }
        }
    ]
}

```
Checkout [procss configuration](https://github.com/vindm/procss#configuration)
 for more info about `.procss.js` config file.
