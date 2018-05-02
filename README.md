## bluegroceries
This repository contains source code for my final year project, initially named Blue Groceries - Online Grocery Store.

### Prequisites 
1. NodeJs - https://nodejs.org/en/download/
2. MySQLCommunity 5.7 - https://dev.mysql.com/downloads/mysql/
3. A working internet connection.

### Installation 

1. Install all the needed prequisites, download links are provided above.
2. Create a MySQL Database, and start the MySQL server.
3. Navigate to the root of this cloned repository and Import Mysql data into your database, using the command line.
  ``` mysql -u 'your-username' -p 'your-database-name' < data/bluegroceriesdata.sql ```

Note : The above code line will not work in Powershell, its recommended to use CMD or some other terminal.

4. Install the node packages for the application using the ``npm install`` command in the terminal.

### Running the app

1. Use ``node app`` command in the terminal, and if there is an error message,and the app crashes, try starting your MySQL server & its related services.
2. Restart the app using ``node app``, after your MySQL server is up.
3. Open your browser, and go to 127.0.0.1:9227
4. You will now be able to use the app. 

Pavittar Singh (157448325)
