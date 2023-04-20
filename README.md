# homectl-next

## Setup

1. Install dependencies: `npm install`
2. Make sure `WS_ENDPOINT` in `.env` points to your homectl server
3. Build the project with `npm run build`

### Running in development mode (immediately see your changes)

```
npm run dev
```

### Running in production mode (app works much faster this way)

```
npm start
```

## HSL Schedule Cards

The HSL time schedule card contents are defined in the `.env` file. 
To show multiple cards, separate the entries with a space ` `. 
To show multiple stops in a card, separate the stop ids with a comma `,`.

Underscores (`_`) are mapped to empty values for the pattern variable. In these cases, all departures are shown for the given stop.

``` env
NEXT_PUBLIC_HSL_CARD_TITLES=Card1 Card2
NEXT_PUBLIC_HSL_STOPS=HSL:1020123,HSL:1020122 HSL:1020120
NEXT_PUBLIC_HSL_PATTERNS=_ HSL:1097N:0:02
```
