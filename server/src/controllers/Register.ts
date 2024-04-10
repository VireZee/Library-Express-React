import AppDataSource from '../DataSource';
import User from '../models/User';
import { Request, Response } from 'express';
import { defSvg, valName, frmtName, valUname, valEmail, Hash, genToken } from '../utils/Validation';

const Register = async (req: Request, res: Response) => {
    const userRepo = AppDataSource.getRepository(User);
    const { name, uname, email, pass, rePass, show } = req.body;
    const errs: Record<string, string> = {};
    const nameErr = valName(name);
    const unameErr = await valUname(uname);
    const emailErr = await valEmail(email);
    if (nameErr) errs.name = nameErr;
    if (unameErr) errs.uname = unameErr;
    if (emailErr) errs.email = emailErr;
    if (!pass) errs.pass = "Password can't be empty!";
    if (!show && pass !== rePass) errs.match = "Password do not match!";
    if (Object.keys(errs).length > 0) return res.status(422).json({ errs });
    const newUser = userRepo.create({
        photo: Buffer.from(defSvg(name), 'utf-8'), name: frmtName(name), username: uname, email, pass: await Hash(pass), created: new Date()
    });
    await userRepo.save(newUser);
    const t = genToken(uname);
    return res.status(200).json(t);
}
export default Register;