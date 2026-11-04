# ChefKart — Practical Exercise Aims

The supplied examples are adapted to the ChefKart cooking-service theme. The required technologies and operations are retained.

## Exercise 1: MongoDB Cooking Service Catalogue

Design a MongoDB database for ChefKart containing service ID, service title, chef name, category, price, and availability. Write MongoDB commands to insert multiple cooking services, retrieve available services, update service availability, and delete a service.

## Exercise 2: Node.js and MongoDB Cook Records

Develop a Node.js program to establish a MongoDB database connection and perform insert, retrieve, update, and delete operations on a collection of ChefKart cook records containing chef ID, name, cuisine, city, visit price, and availability.

## Exercise 3: Flask Cook Details Form

Develop a Python web application for ChefKart using Flask. Accept the cook's name and cuisine or specialization through an HTML form. Validate the input and display the entered cook details.

## Exercise 4: Flask Cooking Appointment Form

Develop a Python web application for ChefKart using Flask. Accept the customer name, preferred cook, appointment date, and contact number through an HTML form. Validate the input and display an appointment-details confirmation.

This exercise confirms entered details only. It does not reserve a slot or store an appointment.

## Exercise 5: Flask and SQLite Cook Profile CRUD

Design and implement a database-driven ChefKart Cook Information Management System using Flask, SQLite, and HTML forms. Provide Create, Read, Update, and Delete operations for cook profiles containing name, cuisine, city, visit fee, and availability.

## Exercise 6: Flask and SQLite Kitchen Staff Records

Design a Python web application for ChefKart Kitchen Staff Management using Flask and SQLite. Accept staff name, role, contact number, and monthly salary through a form, validate and store the details in the database, and display the saved staff records.

## Where Each Aim Is Implemented

| Exercise | Code or Browser Page |
|---|---|
| Exercise 1 (MongoDB Shell) | `backend/scripts/service-catalog.mongosh.js` |
| Exercise 2 (Node.js CRUD) | `backend/scripts/chef-crud-demo.cjs` |
| Exercise 3 (Cook Form) | `services/forms/app.py` -> `/cook-form` |
| Exercise 4 (Appointment Form) | `services/forms/app.py` -> `/appointment` |
| Exercise 5 (Cook Profile CRUD) | `services/forms/app.py` -> `/chefs` |
| Exercise 6 (Kitchen Staff) | `services/forms/app.py` -> `/employees` |
