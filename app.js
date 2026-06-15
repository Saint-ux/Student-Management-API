const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3001;
const FILE = path.join(__dirname, "students.json");

function readData() {
    try {
        const data = fs.readFileSync(FILE, "utf8");
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveData(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function send(res, code, data) {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {

    // HOME
    if (req.method === "GET" && req.url === "/") {
        return send(res, 200, { message: "Student API running" });
    }

    // GET ALL
    if (req.method === "GET" && req.url === "/students") {
        return send(res, 200, readData());
    }

    // GET BY ID
    if (req.method === "GET" && req.url.startsWith("/students/")) {
        const id = parseInt(req.url.split("/")[2]);
        const student = readData().find(s => s.id === id);

        if (!student) return send(res, 404, { message: "Not found" });

        return send(res, 200, student);
    }

    // CREATE
    if (req.method === "POST" && req.url === "/students") {
        let body = "";

        req.on("data", chunk => body += chunk);

        req.on("end", () => {
            const data = JSON.parse(body);
            const students = readData();

            const newStudent = {
                id: Date.now(),
                name: data.name,
                age: data.age,
                department: data.department
            };

            students.push(newStudent);
            saveData(students);

            send(res, 201, newStudent);
        });

        return;
    }

    // UPDATE
    if (req.method === "PUT" && req.url.startsWith("/students/")) {
        const id = parseInt(req.url.split("/")[2]);
        let body = "";

        req.on("data", chunk => body += chunk);

        req.on("end", () => {
            const data = JSON.parse(body);
            const students = readData();

            const index = students.findIndex(s => s.id === id);

            if (index === -1) return send(res, 404, { message: "Not found" });

            students[index] = { ...students[index], ...data };
            saveData(students);

            send(res, 200, students[index]);
        });

        return;
    }

    // DELETE
    if (req.method === "DELETE" && req.url.startsWith("/students/")) {
        const id = parseInt(req.url.split("/")[2]);

        const students = readData();
        const filtered = students.filter(s => s.id !== id);

        if (filtered.length === students.length) {
            return send(res, 404, { message: "Not found" });
        }

        saveData(filtered);
        return send(res, 200, { message: "Deleted successfully" });
    }

    send(res, 404, { message: "Route not found" });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});