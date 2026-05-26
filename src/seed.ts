import { faker } from "@faker-js/faker";
import db from "./db/connection";
import Contact from "./models/mysql/Contact";

const seed = async () => {
  try {
    await db.authenticate();

    const contacts = [];

    for (let i = 0; i < 100; i++) {
      contacts.push({
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        phone: faker.phone.number(),
        email: faker.internet.email(),

        country: faker.helpers.arrayElement(["AR", "GT", "MX", "SV"]),

        city: faker.location.city(),

        status: faker.helpers.arrayElement(["ACTIVE", "INACTIVE"]),

        attributes: {
          age: faker.number.int({
            min: 18,
            max: 70,
          }),
          plan: faker.helpers.arrayElement(["basic", "premium", "pro"]),
          last_purchase_days: faker.number.int({
            min: 1,
            max: 365,
          }),
        },
      });
    }

    await Contact.bulkCreate(contacts);

    console.log("seed complete");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
