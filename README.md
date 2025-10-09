## Setting up
1. Install dependencies 
`npm install`
2. set up DB
`npx prisma migrate dev --name init`
`npx prisma generate`
3. Run the server
`npm run dev`

## API routes
1. `/customer` to create customer
```
{
  "name": "name",
  "phone" : "08123"
}
```
2. `/services` to create services
```
{
    "name": "service name",
    "duration": 60
}
```
3. `/stylists` to create stylists
```
{
  "name": "name",
  "description": "descs",
  "serviceIds": [1,2,3],
  "shifts": ["09:00-12:00", "13:00-18:00"]
}
```
4. `/booking` to create bookings
```
{
  "customerId": 1,
  "stylistId": 1,
  "serviceId": 1,
  "date": "01/01/2025",
  "startTime": "09:50"
}
```
`/booking/:id/cancel` to cancel booking
