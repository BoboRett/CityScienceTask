# Wishlist
- Smooth fullscreen transition (expensive)
- Better link between graph and map (hovering bar label highlights CP, etc.)
- Multiple filters applied simultaneously (i.e. M5, A30)
- Area Graph direction series toggle, rather than just vehicle type over time
- Data sorting
 - By vehicle type count
 - By distance from
- Area Graph transitions
- Map layers
 - Count point density heatmaps
 - Vehicle count density choropleths, needs geoJSON info
- Clean up data handling (probably need database to improve performance further...summing all counts is apocalyptically slow)
- Extract load screen logic outside of React for more responsiveness

# Known Issues
- Filter button widths don't match contents (needs rewriting with React level transitions rather than CSS)
- Slow performance when handling entire data set
