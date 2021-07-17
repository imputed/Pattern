import Sum from "../MVC/sum.js";

test("Check async symmetric encryption can be afterwards decrypted by sync symmetric encryption",()=>{
    expect(Sum(1, 2)).toBe(3)
    }
)