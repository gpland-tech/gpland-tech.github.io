const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cors = require("cors");

const db = mysql.createPool({
    host: "localhost",
    user: "gplandte_master_admin",
    password:"gpland.tech.usa",
    database:"gplandte_gtechland",
})

var tablename ="";
var tempid_user ="";
var tempemail = "";
var temppassword ="";
var temptien =0;
var temptongtien =0;

const path = require('path');
app.use(express.static(path.join(__dirname + "/public")));
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

// app.get("/api/getthefull", (req,res) => {
//     const sqlGet = "SELECT * FROM gpland_users";
//      db.query(sqlGet, (error, result) => {
//          res.send(result);
//     });
// })

// app.post("/api/get", (req,res) => {
//     const email = req.body.email;
//     const password = req.body.password;
//     if (email === "mike@gmail.com" && password === "123"){
//         const sqlGet = "SELECT * FROM gpland_users";
//         db.query(sqlGet, (error, result) => {
//             res.send(result);
//        });
//     } else {
//         const sqlGet = "SELECT * FROM gpland_users WHERE email = ? AND password = ?";
//         db.query(sqlGet, [email, password], (error, result) => {
//             res.send(result);
//        });
//     }   
// })

app.post("/api/get", (req,res) => {
    const email = req.body.email;
    const password = req.body.password;
    const auth = req.body.auth;
    const authadmin = req.body.authadmin;

    if (!auth && !authadmin)
    {
        res.send("NotAuth");
        return;
    }
    if (auth && !authadmin)
    {
        const sqlGet1 = "SELECT * FROM gpland_users WHERE email = ? AND password = ?";
        db.query(sqlGet1, [email, password], (error, result) => {
        res.send(result);
        return;
    })   
    }
    if (!auth && authadmin)
    {
        const sqlGet1 = "SELECT * FROM gpland_users";
        db.query(sqlGet1, (error, result) => {
        res.send(result);
        return;
    })   
    }
})

// user và admin login => từ đó phân loại gửi ngược về frontend
app.post("/api/signin", (req,res) => {
    const email = req.body.email;
    const password = req.body.password;

    const sqlLogin = "SELECT * FROM gpland_users WHERE email = ? AND password = ?";
    if (email !== "" && password !== "" ) {
        db.query(sqlLogin, [email, password], (error, result) => {
            if (error) {
                res.send({error: error});
            }
            if (result) {
                res.send(result);
            } else {
                res.send({ message : "Sai email hoặc password !"});
                return;
            }
        });
    }
})

// check email đăng ký đã được sử dụng chưa ?
app.post("/api/checkemail", (req, res) => {

    const email = req.body.email;
    
    const sqlGetEmail = "SELECT * FROM gpland_users WHERE email = ?"; // query này check xem đã có email này chưa ?

    if (email !== "") {
        db.query(sqlGetEmail, [email], (error, result) => {
            if (result[0]?.email) {
                console.log("result", result[0].email);
                res.send("EmailExisted");
                return;
            }
            else{
                res.send("EmailCheckedOk");
                return;
            }
        });
    }
})

// check id_tructhuoc (tức là id giới thiệu, hàng cha của user) có tồn tại ko ? 
app.post("/api/checktructhuoc_id", (req, res) => {
    
    const tructhuoc_id = req.body.tructhuoc_id;

    const sqlGetTructhuoc_id = "SELECT * FROM gpland_users WHERE id_user = ?"; // chú ý: query này để tìm xem có id này chưa ? id này sẽ là mentor cho id đang làm đăng ký

    if (tructhuoc_id !== "" ) {
        // chú ý xem kỹ ...
        db.query(sqlGetTructhuoc_id, [tructhuoc_id], (error, result) => {
            if (result[0]?.id_user) {
                console.log("result", result[0].id_user);
                res.send("Tructhuoc_idExisted");
                return;
            }
            else{
                res.send("Tructhuoc_idNotFound");
                return;
            }
        });
    }
})

// user signup , nếu thành công => add user vào bảng tổng
app.post("/api/signup", (req, res) => {

    const email = req.body.email;
    const password = req.body.password;
    const tructhuoc_id = req.body.tructhuoc_id;

    var dt = new Date();

    year  = dt.getFullYear().toString().padStart(2, "0");
    month = (dt.getMonth() + 1).toString().padStart(2, "0");
    day   = dt.getDate().toString().padStart(2, "0");
    hour = dt.getHours();
    minute = dt.getMinutes();
    second = dt.getSeconds();
    ngaythamgia = year + "-" + month + "-" + day

    const id_user = day + "" + second + "" + month + "" + hour + "" + year + "" + minute
    const tk_1_address = id_user + "-" + "1";
    const tk_2_address = id_user + "-" + "2";
    const tk_3_address = id_user + "-" + "3";

    if (email !== "" && password !== "" && (tructhuoc_id !== "" || tructhuoc_id === "Gtech-Land")) {
        const sqlInsert = "INSERT INTO gpland_users (id_user, email, password, tk_1_address, tk_2_address, tk_3_address, tructhuoc_id, capbac, ngaythamgia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ? )";
        db.query(sqlInsert, [id_user, email, password, tk_1_address, tk_2_address, tk_3_address, tructhuoc_id, '1', ngaythamgia], (error, result) => {
            if (error) {
                res.send("UserNotAdded");
                return;
            }
            if (result) {
                res.send("UserAdded");
                tablename = id_user;
                return;
            } 
        });
    }
})

// sau khi user đăng ký thành công, tạo bảng tài khoản (id_user_tk) và bảng tài sản (id_user_ts)
app.post("/api/createtable", (req, res) => {
    var email = req.body.email;
    console.log(email);

    if (email !== "") {
        const tablename_tk = tablename + "_tk";
        const sqlCreateTKUserTable = "CREATE TABLE ?? (id_user varchar(100), ngaynaprut date, tk_1_money float, tk_2_money float, tk_3_money float, sotien_nap float, mota_nap varchar(200), sotien_rut float, mota_rut varchar(200), sotien_chi float, mota_chi varchar(200), sotien_thu float, mota_thu varchar(200))";
        const tablename_ts = tablename + "_ts";
        const sqlCreateTSUserTable = "CREATE TABLE ?? (id_user varchar(100), id_duan varchar(50), id_nen varchar(50), bds_muachung varchar(1), so_cophan int(11), dongia_cophan float, ngaymua date, loituc_chothue float)";
    Promise.all([    
        db.query(sqlCreateTKUserTable, [tablename_tk]),
        db.query(sqlCreateTSUserTable, [tablename_ts])
    ]).then (function(error, result) {
        if (error) {
            res.send("UserTableNotAdded");
            tablename = "";
            return;
        }
        if (result) {
            res.send("UserTableAdded");
            tablename = "";
            return;
        } 
    });
    }
})

// ví tiền của user
app.post("/api/getvinaprutuser", (req,res) => {
    const id_user = req.body.id_user;
    const auth = req.body.auth;
    const id_tk = id_user + "_tk" 

    if (id_user !== "" && auth){
        const sqlGetViNapRut = "SELECT * FROM ??";
        db.query(sqlGetViNapRut,[id_tk], (error, result) => {
            res.send(result);
            return;
       });    
    }   
})

// ví tiền của user
app.post("/api/gettaisanuser", (req,res) => {
    const id_user = req.body.id_user;
    const auth = req.body.auth;
    const id_ts = id_user + "_ts" 

    if (id_user !== "" && auth){
        const sqlGetViTaiSan = "SELECT * FROM ??";
        db.query(sqlGetViTaiSan,[id_ts], (error, result) => {
            res.send(result);
            return;
       });    
    }   
})

// phần nạp tiền của user , double check các điều kiện nạp của user từ frontend, nếu ok => ghi vào bảng "yêu cầu nạp"
app.post("/api/naptientaikhoan", (req,res) => {
    
    var dt = new Date();
    year  = dt.getFullYear().toString().padStart(2, "0");
    month = (dt.getMonth() + 1).toString().padStart(2, "0");
    day   = dt.getDate().toString().padStart(2, "0");
    const ngayrutnap = year + "-" + month + "-" + day
    
    const id_user = req.body.id_user;
    const sotien_nap = req.body.sotien_nap;
    const mota_nap = req.body.mota_nap;
    if (sotien_nap < 999999)
    {
        res.send("DepositNotEnough");
        return;
    }

    if (id_user !== ""){
        const sqlNap = "INSERT INTO gpland_user_naprut (id_user, sotien_nap, mota_nap, ngayrutnap) VALUES (?, ?, ?, ?)";
        db.query(sqlNap, [id_user, sotien_nap, mota_nap, ngayrutnap], (error, result) => {
            if (error) {
                res.send("DepositFailed");
                return;
            }
            if (result) {
                res.send("DepositOk");
                return;
            } 
       });    
    }   
})

// phần rút tiền của user , double check các điều kiện rút của user từ frontend, nếu ok => ghi vào bảng "yêu cầu rút"
app.post("/api/ruttientaikhoan", (req,res) => {
    
    var dt = new Date();
    year  = dt.getFullYear().toString().padStart(2, "0");
    month = (dt.getMonth() + 1).toString().padStart(2, "0");
    day   = dt.getDate().toString().padStart(2, "0");
    const ngayrutnap = year + "-" + month + "-" + day
    
    const id_user = req.body.id_user;
    const sotien_rut = req.body.sotien_rut;
    const mota_rut = req.body.mota_rut;
    if (sotien_rut < 999999)
    {
        res.send("WithDrawNotEnough");
        return;
    }

    if (id_user !== ""){
        const sqlRut = "INSERT INTO gpland_user_naprut (id_user, sotien_rut, mota_rut, ngayrutnap) VALUES (?, ?, ?, ?)";
        db.query(sqlRut, [id_user, sotien_rut, mota_rut, ngayrutnap], (error, result) => {
            if (error) {
                res.send("WithDrawFailed");
                return;
            }
            if (result) {
                res.send("WithDrawOk");
                return;
            } 
       });    
    }   
})

// admin mở bảng yêu cầu rút nạp từ user để duyệt => chuyển tiền hoặc báo có
app.post("/api/duyetnaprutadmin", (req,res) => {
    const id_user = req.body.id_user;
    const authadmin = req.body.authadmin;

    if (id_user !== "" && authadmin){
        const sqlDuyetNapRut = "SELECT * FROM gpland_user_naprut";
        db.query(sqlDuyetNapRut, (error, result) => {
            res.send(result);
            return;
       });    
    }   
})

// Phần nạp tiền, duyệt nạp tiền cho user
app.post("/api/adminduyetnap", (req,res) => {
    const id_user = req.body.id_user;
    const sotien_nap = req.body.sotien_nap;
    const authadmin = req.body.authadmin;

    var dt = new Date();
    year  = dt.getFullYear().toString().padStart(2, "0");
    month = (dt.getMonth() + 1).toString().padStart(2, "0");
    day   = dt.getDate().toString().padStart(2, "0");
    const ngayrutnap = year + "-" + month + "-" + day

    if (id_user !== "" && authadmin){
        const sqlDuyetNap = "UPDATE gpland_user_naprut SET confirm = '1' ,capnhat ='1' ,confirmdate = ? WHERE id_user = ? AND sotien_nap = ?";
        db.query(sqlDuyetNap,[ngayrutnap, id_user, sotien_nap], (error, result) => {
            if (error) {
                res.send("ConfirmDepositFailed");
                return;
            }
            if (result) {
                res.send("ConfirmDepositOk");
                return;
            } 
       });    
    }   
})

app.post("/api/adminupdatenap", (req,res) => {

    const id_user = req.body.id_user;
    const sotien_nap = req.body.sotien_nap;
    const mota_nap = req.body.mota_nap;
    const authadmin = req.body.authadmin;
    const id_tk = id_user + "_tk"
    tempid_user = id_user
    
    var tongtiennap = 0;
    var tongtienrut = 0;
    var tongtienthu = 0;
    var tongtienchi = 0;
    var tongtien = 0;

    var dt = new Date();
    year  = dt.getFullYear().toString().padStart(2, "0");
    month = (dt.getMonth() + 1).toString().padStart(2, "0");
    day   = dt.getDate().toString().padStart(2, "0");
    const ngayrutnap = year + "-" + month + "-" + day
    
    TinhTongTienNap(function(responseNap) {
    tongtiennap = responseNap;

        TinhTongTienRut(function(responseRut) {
        tongtienrut = responseRut;

            TinhTongTienThu(function(responseThu) {
            tongtienthu = responseThu;
                
                TinhTongTienChi(function(responseChi) {
                tongtienchi = responseChi;

                    tongtien = tongtiennap + tongtienthu - tongtienrut - tongtienchi;
                    tongtien = tongtien + sotien_nap;

                    if (id_user !== "" && authadmin){
                        const sqlUpdateNap = "INSERT INTO ?? (id_user, ngaynaprut, tk_1_money, sotien_nap, mota_nap) VALUES (?, ?, ?, ?, ?)";
                        db.query(sqlUpdateNap,[id_tk, id_user, ngayrutnap, tongtien, sotien_nap, mota_nap], (error, result) => {
                            if (error) {
                                res.send("UpdateDepositFailed");
                                return;
                            }
                            if (result) {
                                res.send("UpdateDepositOk");
                                return;
                            } 
                        });    
                    }
                })                
            })
        })
    });

})
app.post("/api/adminupdatenaptong", (req,res) => {

    const id_user = req.body.id_user;
    const sotien_nap = req.body.sotien_nap;
    const mota_nap = req.body.mota_nap;
    const authadmin = req.body.authadmin;
    const id_tk = id_user + "_tk"
    tempid_user = id_user
    
    var tongtiennap = 0;
    var tongtienrut = 0;
    var tongtienthu = 0;
    var tongtienchi = 0;
    var tongtien = 0;

    var dt = new Date();
    year  = dt.getFullYear().toString().padStart(2, "0");
    month = (dt.getMonth() + 1).toString().padStart(2, "0");
    day   = dt.getDate().toString().padStart(2, "0");
    const ngayrutnap = year + "-" + month + "-" + day
    
    TinhTongTienNap(function(responseNap) {
        tongtiennap = responseNap;
    
        TinhTongTienRut(function(responseRut) {
        tongtienrut = responseRut;

            TinhTongTienThu(function(responseThu) {
            tongtienthu = responseThu;
                
                TinhTongTienChi(function(responseChi) {
                tongtienchi = responseChi;

                    tongtien = tongtiennap + tongtienthu - tongtienrut - tongtienchi;
        
                    if (id_user !== "" && authadmin){
                        const sqlUpdateViTong = "UPDATE gpland_users SET tk_1_money = ? WHERE id_user = ?";
                        db.query(sqlUpdateViTong, [tongtien, id_user], (error, result) => {
                            if (error) {
                                res.send("UpdateTotalFailed");
                                return;
                            }
                            if (result) {
                                res.send("UpdateTotalOk");
                                return;
                            } 
                        });    
                    }

                })
            })
        })
    });
})
// hết Phần nạp tiền, duyệt nạp tiền cho user

// Phần rút tiền, duyệt rút tiền cho user
app.post("/api/adminduyetrut", (req,res) => {
    const id_user = req.body.id_user;
    const sotien_rut = req.body.sotien_rut;
    const authadmin = req.body.authadmin;

    var dt = new Date();
    year  = dt.getFullYear().toString().padStart(2, "0");
    month = (dt.getMonth() + 1).toString().padStart(2, "0");
    day   = dt.getDate().toString().padStart(2, "0");
    const ngayrutnap = year + "-" + month + "-" + day

    if (id_user !== "" && authadmin){
        const sqlDuyetRut = "UPDATE gpland_user_naprut SET confirm = '1' ,capnhat ='1' ,confirmdate = ? WHERE id_user = ? AND sotien_rut = ?";
        db.query(sqlDuyetRut,[ngayrutnap, id_user, sotien_rut], (error, result) => {
            if (error) {
                res.send("ConfirmWithDrawFailed");
                return;
            }
            if (result) {
                res.send("ConfirmWithDrawOk");
                return;
            } 
       });    
    }   
})

app.post("/api/adminupdaterut", (req,res) => {

    const id_user = req.body.id_user;
    const sotien_rut = req.body.sotien_rut;
    const mota_rut = req.body.mota_rut;
    const authadmin = req.body.authadmin;
    const id_tk = id_user + "_tk"
    tempid_user = id_user
    
    var tongtiennap = 0;
    var tongtienrut = 0;
    var tongtienthu = 0;
    var tongtienchi = 0;
    var tongtien = 0;

    var dt = new Date();
    year  = dt.getFullYear().toString().padStart(2, "0");
    month = (dt.getMonth() + 1).toString().padStart(2, "0");
    day   = dt.getDate().toString().padStart(2, "0");
    const ngayrutnap = year + "-" + month + "-" + day
    
    TinhTongTienNap(function(responseNap) {
        tongtiennap = responseNap;
    
        TinhTongTienRut(function(responseRut) {
        tongtienrut = responseRut;

            TinhTongTienThu(function(responseThu) {
            tongtienthu = responseThu;
                
                TinhTongTienChi(function(responseChi) {
                tongtienchi = responseChi;

                        tongtien = tongtiennap + tongtienthu - tongtienrut - tongtienchi;
                        tongtien = tongtien - sotien_rut;

                        if (id_user !== "" && authadmin){
                            const sqlUpdateRut = "INSERT INTO ?? (id_user, ngaynaprut, tk_1_money, sotien_rut, mota_rut) VALUES (?, ?, ?, ?, ?)";
                            db.query(sqlUpdateRut,[id_tk, id_user, ngayrutnap, tongtien, sotien_rut, mota_rut], (error, result) => {
                                if (error) {
                                    res.send("UpdateWithDrawFailed");
                                    return;
                                }
                                if (result) {
                                    res.send("UpdateWithDrawOk");
                                    return;
                                } 
                            });    
                        }
                })            
            })                
        })
    });
})

app.post("/api/adminupdateruttong", (req,res) => {

    const id_user = req.body.id_user;
    const sotien_rut = req.body.sotien_rut;
    const mota_rut = req.body.mota_rut;
    const authadmin = req.body.authadmin;
    const id_tk = id_user + "_tk"
    tempid_user = id_user
    
    var tongtiennap = 0;
    var tongtienrut = 0;
    var tongtienthu = 0;
    var tongtienchi = 0;
    var tongtien = 0;

    var dt = new Date();
    year  = dt.getFullYear().toString().padStart(2, "0");
    month = (dt.getMonth() + 1).toString().padStart(2, "0");
    day   = dt.getDate().toString().padStart(2, "0");
    const ngayrutnap = year + "-" + month + "-" + day
    
    TinhTongTienNap(function(responseNap) {
    tongtiennap = responseNap;
    
        TinhTongTienRut(function(responseRut) {
        tongtienrut = responseRut;

            TinhTongTienThu(function(responseThu) {
            tongtienthu = responseThu;
                
                TinhTongTienChi(function(responseChi) {
                tongtienchi = responseChi;
                
                    tongtien = tongtiennap + tongtienthu - tongtienrut - tongtienchi;
        
                    if (id_user !== "" && authadmin){
                        const sqlUpdateViTong = "UPDATE gpland_users SET tk_1_money = ? WHERE id_user = ?";
                        db.query(sqlUpdateViTong, [tongtien, id_user], (error, result) => {
                            if (error) {
                                res.send("UpdateTotalFailed");
                                return;
                            }
                            if (result) {
                                res.send("UpdateTotalOk");
                                return;
                            } 
                    });    
                    }
                })
            })
        })
    });
})
// hết Phần rút tiền, duyệt rút tiền cho user

// phần user xác nhận mua
app.post("/api/userxacnhanmua", (req,res) => {
    
    var dt = new Date();
    year  = dt.getFullYear().toString().padStart(2, "0");
    month = (dt.getMonth() + 1).toString().padStart(2, "0");
    day   = dt.getDate().toString().padStart(2, "0");
    const ngaymua = year + "-" + month + "-" + day

    var id_user ="";
    const auth = req.body.auth;
    id_user = req.body.id_user;
    const idDuAn = req.body.idDuAn;
    const idNen = req.body.idNen;
    const bds_muachung = req.body.bds_muachung;
    const so_cophan = req.body.so_cophan;
    const dongia_cophan = req.body.dongia_cophan;
    const sotien_chi = req.body.sotien_chi;
    const mota_chi = req.body.mota_chi;
    const loituc_chothue = req.body.loituc_chothue;

    tempid_user = id_user
    const id_ts = id_user + "_ts"
    const id_tk = id_user + "_tk"
    
    var tongtiennap = 0;
    var tongtienrut = 0;
    var tongtienthu = 0;
    var tongtienchi = 0;
    var tongtien = 0;
    
        const sqlUserXacNhanMua = "INSERT INTO ?? (id_user, id_duan, id_nen, bds_muachung, so_cophan, dongia_cophan, loituc_chothue, ngaymua) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        const sqlUserXacNhanMuaAddVaoBangTong = "INSERT INTO gpland_user_taisan (id_user, id_duan, id_nen, bds_muachung, so_cophan, dongia_cophan, loituc_chothue, ngaymua) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        const sqlUpdateViTong = "UPDATE gpland_users SET tk_1_money = ? WHERE id_user = ?";
        const sqlUpdateViUser = "INSERT INTO ?? (id_user, ngaynaprut, tk_1_money, sotien_chi, mota_chi) VALUES (?, ?, ?, ?, ?)";        

        TinhTongTienNap(function(responseNap) {
            tongtiennap = responseNap;
            
            TinhTongTienRut(function(responseRut) {
            tongtienrut = responseRut;
    
                TinhTongTienThu(function(responseThu) {
                tongtienthu = responseThu;
                    
                    TinhTongTienChi(function(responseChi) {
                    tongtienchi = responseChi;
                        
                        tongtien = tongtiennap + tongtienthu - tongtienrut - tongtienchi;
                        tongtien = tongtien - sotien_chi;

                        if (id_user !== "" && auth){
                            Promise.all([db.query(sqlUserXacNhanMua, [id_ts, id_user, idDuAn, idNen, bds_muachung, so_cophan, dongia_cophan, loituc_chothue, ngaymua]),
                                        db.query(sqlUserXacNhanMuaAddVaoBangTong, [id_user, idDuAn, idNen, bds_muachung, so_cophan, dongia_cophan, loituc_chothue, ngaymua]),
                                        db.query(sqlUpdateViUser, [id_tk, id_user, ngaymua, tongtien, sotien_chi, mota_chi]),
                                        db.query(sqlUpdateViTong, [tongtien, id_user])
                            ]).then (function(error, result) {
                                if (error) {
                                    //res.send("UserXacNhanMuaFailed");
                                    id_user="";
                                    return;
                                }
                                if (result) {
                                    res.send("UserXacNhanMuaOk");
                                    id_user="";
                                    return;
                                } 
                            });
                            return;
                        }   
                    })
                })
            })
        });
   
})
// hết phần user xác nhận mua


// hàm tính tổng tiền nạp của user
function TinhTongTienNap(callback) {
    const id_tk = tempid_user + "_tk"
    var tongtien = 0;

    const sqlTinhTongTien = "SELECT sotien_nap FROM ??";
        db.query(sqlTinhTongTien,[id_tk] , (error, result) => {

            if(error){
                tongtien = 0;
                throw error;
            }
            else {
                for (let i=0; i < result.length; i++)
                {
                    tongtien += result[i].sotien_nap;
                }
            }
            callback(tongtien);
            return;
       });
       
}

// hàm tính tổng tiền rút của user
function TinhTongTienRut(callback) {
    const id_tk = tempid_user + "_tk"
    var tongtien = 0;

    const sqlTinhTongTien = "SELECT sotien_rut FROM ??";
        db.query(sqlTinhTongTien,[id_tk] , (error, result) => {

            if(error){
                tongtien = 0;
                throw error;
            }
            else {
                for (let i=0; i < result.length; i++)
                {
                    tongtien += result[i].sotien_rut;
                }
            }
            callback(tongtien);
            return;
       });
}

// hàm tính tổng tiền thu của user
function TinhTongTienThu(callback) {
    const id_tk = tempid_user + "_tk"
    var tongtien = 0;

    const sqlTinhTongTien = "SELECT sotien_thu FROM ??";
        db.query(sqlTinhTongTien,[id_tk] , (error, result) => {

            if(error){
                tongtien = 0;
                throw error;
            }
            else {
                for (let i=0; i < result.length; i++)
                {
                    tongtien += result[i].sotien_thu;
                }
            }
            callback(tongtien);
            return;
       });
}

// hàm tính tổng tiền chi của user
function TinhTongTienChi(callback) {
    const id_tk = tempid_user + "_tk"
    var tongtien = 0;

    const sqlTinhTongTien = "SELECT sotien_chi FROM ??";
        db.query(sqlTinhTongTien,[id_tk] , (error, result) => {

            if(error){
                tongtien = 0;
                throw error;
            }
            else {
                for (let i=0; i < result.length; i++)
                {
                    tongtien += result[i].sotien_chi;
                }
            }
            callback(tongtien);
            return;
       });
}

app.get("/whoareyou", (req, res) => {
    res.send("I am Server GPLand");
})

app.listen(5000,() => {
    console.log("Server is running on Port 5000");
});
