const fastify = require("fastify")({ logger: false });

// Initialize a counter variable
let counter = 0;

const xFile = await Bun.file("/files/x.json").text();
const cFile = await Bun.file("/files/c.json").text();
const excludeFile = await Bun.file("/files/exclude.json").text();

const xData = JSON.parse(xFile);
const cData = JSON.parse(cFile);
const excludeData = JSON.parse(excludeFile);

const allValues = Object.keys(cData)
	.map((key) => {
		return [["A", key].join("-"), ["B", key].join("-")];
	})
	.flat();

const validValues = allValues.filter((value) => !excludeData.includes(value));

const counterMax = Object.keys(validValues).length;

fastify.get("/", async (req, res) => {
	// Increment the counter
	counter++;
	if (counter >= counterMax) {
		counter = 0;
	}
	const [condition, valuesSet] = validValues[counter].split("-");

	return {
		counter: valuesSet,
		condition: condition,
		valuesSet: counter,
		dataSet: {
			X: xData[valuesSet],
			C: cData[valuesSet]
		}
	};
});

fastify.get("/reset", async (req, res) => {
	counter = 0;
	return {
		counter: counter,
		message: "Counter has been reset to 0"
	};
});

fastify.get("/current", async (req, res) => {
	return {
		counter: counter,
		message: `Current counter value is ${counter}`
	};
});

fastify.get("/websurge-allow.txt", async (req, res) => {
	res.code(200).send();
});

fastify.get("/set/:value", async (req, res) => {
	const value = parseInt(req.params.value);

	if (isNaN(value)) {
		res.code(400).send({
			error: "Invalid value",
			message: "Please provide a valid integer. Example: /set/42"
		});
		return;
	}
	if (value < 1 || value > counterMax) {
		res.code(400).send({
			error: "Value out of range",
			message: `Please provide a value between 1 and ${counterMax}. Example: /set/42`
		});
		return;
	}

	counter = value;
	return {
		counter: counter,
		message: `Counter has been set to ${counter}`
	};
});

// Run the server!
const start = async () => {
	try {
		// Listen on port 3000, or a port specified by the environment
		await fastify.listen({ port: process.env.PORT || 3000, host: "0.0.0.0" });
		fastify.log.info(`Server listening on ${fastify.server.address().port}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();
